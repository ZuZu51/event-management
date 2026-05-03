package com.example.event_management.Ticket.service;

import com.example.event_management.Attendance.entity.AttendanceSession;
import com.example.event_management.Attendance.repository.AttendanceSessionRepository;
import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.entity.Mode;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Mail.service.EmailService;
import com.example.event_management.Ticket.dto.TicketDTO;
import com.example.event_management.Ticket.dto.TicketAttendanceDTO;
import com.example.event_management.Ticket.entity.Status;
import com.example.event_management.Ticket.entity.Ticket;
import com.example.event_management.Ticket.repository.TicketRepository;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.utils.QRCodeGenerator;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EventRepository eventRepository;
    private final EmailService emailService;
    private final AttendanceSessionRepository sessionRepository;

    @Override
    public Ticket createTicket(Long userId, Long eventId) {
        // 1️⃣ Lấy thông tin user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // 2️⃣ Lấy thông tin event
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));

        // 2.1️⃣ Kiểm tra user đã có ticket cho event này chưa
        boolean exists = ticketRepository.existsByUserIdAndEventId(userId, eventId);
        if (exists) {
            throw new RuntimeException("User has already registered for this event");
        }

        // 3️⃣ Tạo đối tượng ticket ban đầu
        Ticket ticket = Ticket.builder()
                .user(user)
                .event(event)
                .status(Status.NONE)
                .build();

        // 4️⃣ Lưu lần đầu để sinh ID và ticketCode (qua @PrePersist)
        ticket = ticketRepository.save(ticket);

        // 5️⃣ Lấy session của event (nếu có)
        AttendanceSession session = sessionRepository.findByEventId(eventId)
                .stream()
                .findFirst()
                .orElse(null);

        // 6️⃣ Xác định checkInType và sinh QR code nếu cần
        String qrBase64 = null;
        String checkInType = event.getCheckInType() != null ? event.getCheckInType().toString() : "NONE";
        
        if (checkInType.equals("QR_SCAN") || checkInType.equals("BOTH")) {
            qrBase64 = QRCodeGenerator.generateQRCodeBase64(ticket.getTicketCode(), 200, 200);
            ticket.setQrCodeBase64(qrBase64);
        }

        // 7️⃣ Lưu ticket
        ticket = ticketRepository.save(ticket);

        // 8️⃣ Chuẩn bị và gửi email xác nhận vé
        try {
            sendConfirmationEmail(user, event, ticket, session, qrBase64, checkInType);
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("❌ Lỗi khi gửi email xác nhận vé: " + e.getMessage());
        }

        return ticket;
    }

    /**
     * 📨 Gửi email xác nhận vé dựa trên loại check-in
     */
    private void sendConfirmationEmail(User user, Event event, Ticket ticket, AttendanceSession session, 
                                       String qrBase64, String checkInType) throws Exception {
        String subject = "🎟 Vé dự sự kiện: " + event.getName();
        String htmlBody = buildEmailBody(user, event, ticket, session, qrBase64, checkInType);
        
        // Gửi email
        if ((checkInType.equals("QR_SCAN") || checkInType.equals("BOTH")) && qrBase64 != null) {
            byte[] qrBytes = java.util.Base64.getDecoder().decode(qrBase64);
            emailService.sendHtmlMessageWithImage(user.getEmail(), subject, htmlBody, qrBytes, "ticket_qr");
        } else {
            emailService.sendHtmlMessageWithImage(user.getEmail(), subject, htmlBody, null, null);
        }
        
        System.out.println("✅ Email xác nhận vé đã được gửi đến: " + user.getEmail());
    }

    /**
     * 📧 Xây dựng HTML body email - Tất cả null check đã bao gồm
     */
    private String buildEmailBody(User user, Event event, Ticket ticket, AttendanceSession session, 
                                 String qrBase64, String checkInType) {
        StringBuilder htmlBody = new StringBuilder();
        
        htmlBody.append("""
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #fafafa;'>
            <h2 style='color: #2c3e50;'>Xin chào %s,</h2>
            <p style='font-size: 16px;'>Cảm ơn bạn đã đăng ký tham gia sự kiện <b style='color: #2980b9;'>%s</b>.</p>
        """.formatted(user.getName(), event.getName()));
        
        // ========== PHẦN THỜI GIAN ĐIỂM DANH ==========
        if (session != null && !checkInType.equals("NONE")) {
            boolean hasCheckInStart = session.getCheckInStart() != null;
            boolean hasCheckInEnd = session.getCheckInEnd() != null;
            boolean hasCheckOutStart = session.getCheckOutStart() != null;
            boolean hasCheckOutEnd = session.getCheckOutEnd() != null;
            
            if (hasCheckInStart || hasCheckInEnd || hasCheckOutStart || hasCheckOutEnd) {
                htmlBody.append("""
            <div style='margin: 15px 0; padding: 15px; background-color: #e8f4f8; border-left: 4px solid #2980b9; border-radius: 5px;'>
                <h3 style='color: #2980b9; margin-top: 0;'>⏰ Thời gian điểm danh</h3>
                """);
                
                // Check-in
                if (hasCheckInStart || hasCheckInEnd) {
                    htmlBody.append("<p style='margin: 8px 0; font-size: 15px;'><b>Check-in:</b> ");
                    if (hasCheckInStart && hasCheckInEnd) {
                        htmlBody.append(session.getCheckInStart()).append(" - ").append(session.getCheckInEnd());
                    } else if (hasCheckInStart) {
                        htmlBody.append("Từ ").append(session.getCheckInStart());
                    } else {
                        htmlBody.append("Đến ").append(session.getCheckInEnd());
                    }
                    htmlBody.append("</p>");
                }
                
                // Check-out
                if (hasCheckOutStart || hasCheckOutEnd) {
                    htmlBody.append("<p style='margin: 8px 0; font-size: 15px;'><b>Check-out:</b> ");
                    if (hasCheckOutStart && hasCheckOutEnd) {
                        htmlBody.append(session.getCheckOutStart()).append(" - ").append(session.getCheckOutEnd());
                    } else if (hasCheckOutStart) {
                        htmlBody.append("Từ ").append(session.getCheckOutStart());
                    } else {
                        htmlBody.append("Đến ").append(session.getCheckOutEnd());
                    }
                    htmlBody.append("</p>");
                }
                
                htmlBody.append("</div>");
            }
        }
        
        // ========== PHẦN MÃ VÉ / QR CODE ==========
        if ((checkInType.equals("QR_SCAN") || checkInType.equals("BOTH")) && qrBase64 != null) {
            // QR code
            htmlBody.append("""
            <p style='font-size: 16px;'>Vui lòng quét mã QR bên dưới khi đến tham dự sự kiện:</p>
            <p style='font-size: 16px;'><b>Mã QR điểm danh của bạn</b></p>
            <div style='text-align: center; margin: 20px 0;'>
                <img src='cid:ticket_qr' alt='QR Code' style='width:200px; height:200px; border:1px solid #ccc; border-radius: 10px;'/>
            </div>
            """);
        } else if (!checkInType.equals("NONE")) {
            // Mã ticket (cho AUTO hoặc khi không có QR)
            htmlBody.append("""
            <div style='margin: 15px 0; text-align: center;'>
                <span style='font-size: 15px;'>Mã vé của bạn:</span>
                <h3 style='background-color: #ecf0f1; padding: 10px; border-radius: 8px; display: inline-block;'>%s</h3>
            </div>
            """.formatted(ticket.getTicketCode()));
        }
        
        // ========== PHẦN NGÀY VÀ ĐỊA ĐIỂM ==========
        if (event.getDate() != null) {
            htmlBody.append("<p><b>📅 Ngày:</b> ").append(event.getDate()).append("</p>");
        }
        if (event.getLocation() != null && !event.getLocation().trim().isEmpty()) {
            htmlBody.append("<p><b>📍 Địa điểm:</b> ").append(event.getLocation()).append("</p>");
        }
        
        // ========== PHẦN LINK TẢM GIA / Q&A ==========
        if (event.getMode() == Mode.ONLINE || event.getMode() == Mode.HYBRID) {
            if (event.getJoinLink() != null && !event.getJoinLink().trim().isEmpty()) {
                htmlBody.append("""
            <p style='font-size: 16px;'>
                🔗 <b>Link tham gia sự kiện:</b> <a href='%s'>%s</a>
            </p>
            """.formatted(event.getJoinLink(), event.getJoinLink()));
            }
        }
        
        if (!checkInType.equals("NONE") && event.getQaLink() != null && !event.getQaLink().trim().isEmpty()) {
            htmlBody.append("""
            <p style='font-size: 16px;'>
                ❓ <b>Nếu muốn đặt câu hỏi:</b> <a href='%s'>%s</a>
            </p>
            """.formatted(event.getQaLink(), event.getQaLink()));
        }
        
        // ========== FOOTER ==========
        htmlBody.append("""
            <hr style='margin-top: 20px;'>
            <p style='font-size: 14px; color: #555;'>Cảm ơn bạn đã sử dụng hệ thống <b>Event Management</b>!<br>Hẹn gặp lại bạn tại sự kiện 🎉</p>
        </div>
        """);
        
        return htmlBody.toString();
    }


    @Override
    public Optional<Ticket> getTicketById(Long id) {
        return ticketRepository.findById(id);
    }

    @Override
    public Optional<Ticket> getTicketByCode(String ticketCode) {
        return ticketRepository.findByTicketCode(ticketCode);
    }

    @Override
    public TicketDTO updateTicketStatus(String ticketCode, Long idEvent) {
        Ticket ticket = ticketRepository.findByTicketCode(ticketCode)
                .orElseThrow(() -> new RuntimeException("Ticket not found"));

        // Kiểm tra idEvent
        if (!ticket.getEvent().getId().equals(idEvent)) {
            throw new RuntimeException("Ticket does not belong to this event");
        }

        switch (ticket.getStatus()) {
            case NONE:
                ticket.setStatus(Status.CHECKED_IN);
                ticket.setCheckInTime(LocalDateTime.now());
                break;
            case CHECKED_IN:
                ticket.setStatus(Status.CHECKED_OUT);
                ticket.setCheckOutTime(LocalDateTime.now());
                break;
            case CHECKED_OUT:
                throw new RuntimeException("Ticket has already been checked out");
            default:
                throw new RuntimeException("Invalid ticket status");
        }

        ticket = ticketRepository.save(ticket);

        // Chuyển entity -> DTO
        return new TicketDTO(
                ticket.getTicketCode(),
                ticket.getStatus(),
                ticket.getCheckInTime(),
                ticket.getCheckOutTime(),
                ticket.getEvent().getName(),    // chỉ lấy tên event
                ticket.getUser().getName()  // chỉ lấy tên user
        );
    }


    @Override
    public List<Ticket> getTicketsByUser(Long userId) {
        return ticketRepository.findByUserId(userId);
    }

    @Override
    public List<Ticket> getTicketsByEvent(Long eventId) {
        return ticketRepository.findByEventId(eventId);
    }

    @Override
    public List<TicketAttendanceDTO> getEventAttendanceFromTickets(Long eventId) {
        List<Ticket> tickets = ticketRepository.findByEventId(eventId);
        
        return tickets.stream()
                .map(ticket -> new TicketAttendanceDTO(
                        ticket.getId(),
                        ticket.getUser().getId(),
                        ticket.getTicketCode(),
                        ticket.getUser().getName(),
                        ticket.getUser().getEmail(),
                        ticket.getUser().getStudentId(),
                        ticket.getStatus(),
                        ticket.getCheckInTime(),
                        ticket.getCheckOutTime()
                ))
                .toList();
    }

    @Override
    public void cancelTicket(Long userId, Long eventId) {
        // 1️⃣ Tìm vé của user cho event này
        Optional<Ticket> optionalTicket = ticketRepository.findByUserIdAndEventId(userId, eventId);
        if (optionalTicket.isEmpty()) {
            throw new RuntimeException("Ticket not found");
        }

        Ticket ticket = optionalTicket.get();
        Event event = ticket.getEvent();
        
        // 2️⃣ Kiểm tra điều kiện hủy: sự kiện phải còn cách > 2 ngày
        java.time.LocalDate eventDate = event.getDate();
        java.time.LocalDate today = java.time.LocalDate.now();
        long daysUntilEvent = java.time.temporal.ChronoUnit.DAYS.between(today, eventDate);

        if (daysUntilEvent <= 2) {
            throw new RuntimeException("Không thể hủy vé, sự kiện diễn ra trong 2 ngày tới");
        }

        // 3️⃣ Xóa vé
        ticketRepository.delete(ticket);

        // 4️⃣ Gửi email xác nhận hủy vé
        try {
            User user = ticket.getUser();
            if (user != null && user.getEmail() != null) {
                String subject = "Xác nhận hủy vé: " + event.getName();
                String htmlBody = buildCancelTicketEmailBody(user, event);
                emailService.sendHtmlMessageWithImage(
                    user.getEmail(),
                    subject,
                    htmlBody,
                    null,
                    null
                );
                System.out.println("📩 Email xác nhận hủy vé gửi tới: " + user.getEmail());
            }
        } catch (Exception e) {
            System.err.println("⚠️ Lỗi gửi email hủy vé: " + e.getMessage());
        }
    }

    /**
     * 📨 Nội dung email xác nhận hủy vé
     */
    private String buildCancelTicketEmailBody(User user, Event event) {
        return """
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f9a825; 
                    border-radius: 10px; padding: 20px; background-color: #fff9e6;'>
            <h2 style='color: #f9a825;'>Xin chào %s,</h2>
            <p style='font-size: 16px;'>Bạn đã hủy vé tham gia sự kiện <b style='color: #d9534f;'>%s</b>.</p>
            
            <div style='margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #f9a825;'>
                <p style='margin: 5px 0;'><strong>📅 Ngày:</strong> %s</p>
                <p style='margin: 5px 0;'><strong>⏰ Giờ:</strong> %s</p>
                <p style='margin: 5px 0;'><strong>📍 Địa điểm:</strong> %s</p>
            </div>

            <p style='font-size: 15px;'>Nếu bạn muốn đăng ký lại, vui lòng truy cập trang sự kiện trước 2 ngày diễn ra.</p>

            <hr style='margin-top: 20px;'>
            <p style='font-size: 14px; color: #555;'>Trân trọng,<br><b>Hệ thống Event Management</b></p>
        </div>
        """.formatted(
            user.getName(),
            event.getName(),
            event.getDate().toString(),
            event.getStartTime(),
            event.getLocation()
        );
    }
}
