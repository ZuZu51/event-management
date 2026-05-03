package com.example.event_management.Event.controller;

import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.entity.EventInvitation;
import com.example.event_management.Event.entity.Mode;
import com.example.event_management.Event.repository.EventInvitationRepository;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Mail.service.EmailService;
import com.example.event_management.Ticket.entity.Ticket;
import com.example.event_management.Ticket.repository.TicketRepository;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.utils.QRCodeGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/invitations")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class InvitationController {

    private final EventInvitationRepository invitationRepository;
    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * POST /invitations/{invitationId}/accept - Accept an invitation
     */
    @PostMapping("/{invitationId}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable Long invitationId) {
        Optional<EventInvitation> invitationOpt = invitationRepository.findById(invitationId);
        
        if (invitationOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        EventInvitation invitation = invitationOpt.get();

        // Check if invitation has expired
        if (LocalDateTime.now().isAfter(invitation.getExpiresAt())) {
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Invitation has expired")
            );
        }

        // Check if already processed
        if (!invitation.getStatus().equals(EventInvitation.InvitationStatus.PENDING)) {
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Invitation already processed")
            );
        }

        // Update invitation status
        invitation.setStatus(EventInvitation.InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());
        invitationRepository.save(invitation);

        // Create ticket if not exists
        boolean ticketExists = ticketRepository.existsByUserIdAndEventId(
                invitation.getInvitedUserId(), 
                invitation.getEventId()
        );

        Long ticketId = null;
        if (!ticketExists) {
            Optional<User> userOpt = userRepository.findById(invitation.getInvitedUserId());
            Optional<Event> eventOpt = eventRepository.findById(invitation.getEventId());
            
            if (userOpt.isPresent() && eventOpt.isPresent()) {
                User user = userOpt.get();
                Event event = eventOpt.get();
                
                // Create ticket
                Ticket ticket = Ticket.builder()
                        .user(user)
                        .event(event)
                        .build();
                Ticket savedTicket = ticketRepository.save(ticket);
                ticketId = savedTicket.getId();

                // Generate QR code
                String qrBase64 = QRCodeGenerator.generateQRCodeBase64(savedTicket.getTicketCode(), 200, 200);
                savedTicket.setQrCodeBase64(qrBase64);
                savedTicket = ticketRepository.save(savedTicket);

                // Send confirmation email
                try {
                    byte[] qrBytes = java.util.Base64.getDecoder().decode(qrBase64);
                    String subject = "🎟 Vé dự sự kiện: " + event.getName();

                    // Additional info
                    String additionalInfo = "";

                    // Join link for ONLINE or HYBRID events
                    if (event.getMode() == Mode.ONLINE || event.getMode() == Mode.HYBRID) {
                        additionalInfo += """
                        <p style='font-size: 16px;'>
                            🔗 <b>Link tham gia sự kiện:</b> <a href='%s'>%s</a>
                        </p>
                        """.formatted(event.getJoinLink(), event.getJoinLink());
                    }

                    // Q&A link
                    additionalInfo += """
                    <p style='font-size: 16px;'>
                        ❓ <b>Nếu muốn đặt câu hỏi:</b> <a href='%s'>%s</a>
                    </p>
                    """.formatted(event.getQaLink(), event.getQaLink());

                    // HTML email body
                    String htmlBody = """
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #fafafa;'>
                    <h2 style='color: #2c3e50;'>Xin chào %s,</h2>
                    <p style='font-size: 16px;'>Bạn đã chấp nhận lời mời tham gia sự kiện <b style='color: #2980b9;'>%s</b>.</p>
                    
                    <div style='margin: 15px 0; text-align: center;'>
                        <span style='font-size: 15px;'>Mã của bạn:</span>
                        <h3 style='background-color: #ecf0f1; padding: 10px; border-radius: 8px; display: inline-block;'>%s</h3>
                    </div>
                    
                    <p style='font-size: 16px;'>Vui lòng quét mã QR bên dưới khi đến tham dự sự kiện:</p>
                    <div style='text-align: center; margin: 20px 0;'>
                        <img src='cid:ticket_qr' alt='QR Code' style='width:200px; height:200px; border:1px solid #ccc; border-radius: 10px;'/>
                    </div>

                    <p><b>📅 Thời gian:</b> %s</p>
                    <p><b>📍 Địa điểm:</b> %s</p>

                    %s

                    <hr style='margin-top: 20px;'>
                    <p style='font-size: 14px; color: #555;'>Cảm ơn bạn đã sử dụng hệ thống <b>Event Management</b>!<br>Hẹn gặp lại bạn tại sự kiện 🎉</p>
                </div>
                """.formatted(
                        user.getName(),
                        event.getName(),
                        savedTicket.getTicketCode(),
                        event.getDate().toString(),
                        event.getLocation(),
                        additionalInfo
                    );

                    // Send email with QR code
                    emailService.sendHtmlMessageWithImage(
                            user.getEmail(),
                            subject,
                            htmlBody,
                            qrBytes,
                            "ticket_qr"
                    );

                    System.out.println("✅ Email xác nhận vé đã được gửi đến: " + user.getEmail());

                } catch (Exception e) {
                    e.printStackTrace();
                    System.err.println("❌ Lỗi khi gửi email xác nhận vé: " + e.getMessage());
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Invitation accepted successfully",
                "ticketId", ticketId,
                "eventId", invitation.getEventId()
        ));
    }

    /**
     * POST /invitations/{invitationId}/reject - Reject an invitation
     */
    @PostMapping("/{invitationId}/reject")
    public ResponseEntity<?> rejectInvitation(
            @PathVariable Long invitationId,
            @RequestBody(required = false) Map<String, String> request) {
        Optional<EventInvitation> invitationOpt = invitationRepository.findById(invitationId);
        
        if (invitationOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        EventInvitation invitation = invitationOpt.get();

        // Check if already processed
        if (!invitation.getStatus().equals(EventInvitation.InvitationStatus.PENDING)) {
            return ResponseEntity.badRequest().body(
                    Map.of("success", false, "message", "Invitation already processed")
            );
        }

        // Update invitation status
        invitation.setStatus(EventInvitation.InvitationStatus.REJECTED);
        if (request != null && request.containsKey("reason")) {
            invitation.setRejectionReason(request.get("reason"));
        }
        invitationRepository.save(invitation);

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Invitation rejected successfully"
        ));
    }
}
