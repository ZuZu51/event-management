package com.example.event_management.Event.entity;

import com.example.event_management.User.entity.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "event_invitations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID sự kiện
    @Column(name = "event_id", nullable = false)
    private Long eventId;

    // ID người được mời (sinh viên)
    @Column(name = "invited_user_id", nullable = false)
    private Long invitedUserId;

    // ID người mời (admin/organizer)
    @Column(name = "invited_by_id")
    private Long invitedByUserId;

    // Relationship to User (invited person)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_user_id", insertable = false, updatable = false)
    private User invitedUser;

    // Relationship to User (person who sent invitation)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by_id", insertable = false, updatable = false)
    private User invitedByUser;

    // Trạng thái: PENDING, ACCEPTED, REJECTED, EXPIRED
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InvitationStatus status = InvitationStatus.PENDING;

    // Thời gian mời
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime invitedAt;

    // Thời gian chấp nhận
    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    // Ghi chú (nếu từ chối)
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;

    // Ngày hết hạn lời mời
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    public enum InvitationStatus {
        PENDING,      // Chờ trả lời
        ACCEPTED,     // Đã chấp nhận (tự động tạo ticket)
        REJECTED,     // Đã từ chối
        EXPIRED       // Hết hạn
    }
}
