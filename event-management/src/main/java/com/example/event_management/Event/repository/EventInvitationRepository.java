package com.example.event_management.Event.repository;

import com.example.event_management.Event.entity.EventInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventInvitationRepository extends JpaRepository<EventInvitation, Long> {

    // Lấy danh sách lời mời cho một sự kiện
    List<EventInvitation> findByEventId(Long eventId);

    // Lấy danh sách lời mời của một sinh viên
    List<EventInvitation> findByInvitedUserId(Long invitedUserId);

    // Lấy lời mời cụ thể
    Optional<EventInvitation> findByEventIdAndInvitedUserId(Long eventId, Long invitedUserId);

    // Lấy danh sách lời mời còn hiệu lực (PENDING) của một sinh viên
    List<EventInvitation> findByInvitedUserIdAndStatus(Long invitedUserId, EventInvitation.InvitationStatus status);

    // Kiểm tra xem sinh viên đã được mời chưa
    boolean existsByEventIdAndInvitedUserIdAndStatus(Long eventId, Long invitedUserId, EventInvitation.InvitationStatus status);

    // Đếm số lời mời PENDING cho một sự kiện
    long countByEventIdAndStatus(Long eventId, EventInvitation.InvitationStatus status);
}
