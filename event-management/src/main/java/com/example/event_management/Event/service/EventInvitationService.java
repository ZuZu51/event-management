package com.example.event_management.Event.service;

import com.example.event_management.Event.entity.EventInvitation;
import com.example.event_management.Event.repository.EventInvitationRepository;
import com.example.event_management.Mail.service.EmailService;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@AllArgsConstructor
@Slf4j
public class EventInvitationService {

    private final EventInvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    /**
     * Mời một sinh viên tham gia sự kiện
     */
    public EventInvitation inviteStudent(Long eventId, Long invitedUserId, LocalDateTime expiresAt) {
        // Kiểm tra sinh viên đã được mời chưa
        Optional<EventInvitation> existing = invitationRepository.findByEventIdAndInvitedUserId(eventId, invitedUserId);
        if (existing.isPresent()) {
            log.warn("Student {} is already invited to event {}", invitedUserId, eventId);
            return existing.get();
        }

        // Tạo lời mời mới
        EventInvitation invitation = EventInvitation.builder()
                .eventId(eventId)
                .invitedUserId(invitedUserId)
                .status(EventInvitation.InvitationStatus.PENDING)
                .expiresAt(expiresAt)
                .build();

        invitation = invitationRepository.save(invitation);

        // Gửi email thông báo
        try {
            User user = userRepository.findById(invitedUserId)
                    .orElse(null);
            if (user != null) {
                String subject = "📧 Bạn đã được mời tham gia một sự kiện!";
                String htmlBody = """
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto;'>
                            <h2>Xin chào %s,</h2>
                            <p>Bạn đã được mời tham gia một sự kiện trong hệ thống Event Management.</p>
                            <p><strong>Vui lòng kiểm tra ứng dụng để xem chi tiết lời mời.</strong></p>
                            <p style='color: #888; font-size: 12px;'>
                                Lời mời sẽ hết hạn vào: %s
                            </p>
                        </div>
                        """.formatted(user.getName(), expiresAt);

                emailService.sendHtmlMessageWithImage(user.getEmail(), subject, htmlBody, null, null);
                log.info("Invitation email sent to {}", user.getEmail());
            }
        } catch (Exception e) {
            log.error("Failed to send invitation email: {}", e.getMessage());
        }

        return invitation;
    }

    /**
     * Sinh viên chấp nhận lời mời
     */
    public EventInvitation acceptInvitation(Long invitationId) {
        EventInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        // Kiểm tra lời mời còn hiệu lực không
        if (invitation.getExpiresAt() != null && LocalDateTime.now().isAfter(invitation.getExpiresAt())) {
            invitation.setStatus(EventInvitation.InvitationStatus.EXPIRED);
            invitationRepository.save(invitation);
            throw new RuntimeException("Invitation has expired");
        }

        invitation.setStatus(EventInvitation.InvitationStatus.ACCEPTED);
        invitation.setAcceptedAt(LocalDateTime.now());

        return invitationRepository.save(invitation);
    }

    /**
     * Sinh viên từ chối lời mời
     */
    public EventInvitation rejectInvitation(Long invitationId, String reason) {
        EventInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        invitation.setStatus(EventInvitation.InvitationStatus.REJECTED);
        invitation.setRejectionReason(reason);

        return invitationRepository.save(invitation);
    }

    /**
     * Lấy danh sách lời mời cho sự kiện
     */
    public List<EventInvitation> getInvitationsByEvent(Long eventId) {
        return invitationRepository.findByEventId(eventId);
    }

    /**
     * Lấy danh sách lời mời của sinh viên
     */
    public List<EventInvitation> getInvitationsByStudent(Long invitedUserId) {
        return invitationRepository.findByInvitedUserId(invitedUserId);
    }

    /**
     * Lấy danh sách lời mời chờ trả lời của sinh viên
     */
    public List<EventInvitation> getPendingInvitations(Long invitedUserId) {
        return invitationRepository.findByInvitedUserIdAndStatus(
                invitedUserId,
                EventInvitation.InvitationStatus.PENDING
        );
    }

    /**
     * Đếm số lời mời PENDING cho sự kiện
     */
    public long countPendingInvitations(Long eventId) {
        return invitationRepository.countByEventIdAndStatus(
                eventId,
                EventInvitation.InvitationStatus.PENDING
        );
    }
}
