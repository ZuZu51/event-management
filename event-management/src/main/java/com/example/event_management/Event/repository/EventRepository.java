package com.example.event_management.Event.repository;

import com.example.event_management.Event.dto.*;
import com.example.event_management.Event.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    // Lấy event có id lớn nhất
    Optional<Event> findTopByOrderByIdDesc();

    // Tìm event theo mã customId (8 ký tự ngẫu nhiên)
    Optional<Event> findByCustomId(String customId);

    // Tìm tất cả event theo trạng thái active (0 - 3)
    List<Event> findByActive(Integer active);

    // Tìm theo tên (tìm kiếm gần đúng)
    List<Event> findByNameContainingIgnoreCase(String name);

    // Tìm tất cả event theo organizer (tác giả/tổ chức) - chính xác
    List<Event> findByOrganizer(String organizer);

    // Tìm theo organizer một cách linh hoạt: tìm chứa (case-insensitive)
    List<Event> findByOrganizerContainingIgnoreCase(String organizerPart);

    // e.is_invite AS isInvite,
    @Query(value = """
    SELECT 
        e.id AS eventId,
        e.image_path AS imagePath,
        e.name AS eventName,
        e.mode AS eventMode,
        e.created_at AS createdAt,
        e.start_time AS startTime,
        e.duration_minutes AS durationMinutes,
        e.category_id AS category,
        e.description AS description,
        e.date AS date,
        e.ticket_price AS ticketPrice,
        e.ticketed AS ticketed,
        e.active AS active,
        e.approval_status AS approvalStatus,
        e.location AS location,
        e.created_by_id AS createdById,
        e.quantity AS quantity,
        
        e.is_for_school AS isForSchool,
        
        e.is_open AS isOpen,
        COUNT(DISTINCT t.id) AS ticketCount,
        COUNT(DISTINCT CASE WHEN s.role = 'SPEAKER' THEN s.id END) AS speakerCount,
        COUNT(DISTINCT CASE WHEN s.role = 'GUEST' THEN s.id END) AS guestCount
    FROM events e
    LEFT JOIN tickets t ON e.id = t.event_id
    LEFT JOIN speakers s ON e.id = s.event_id
    GROUP BY e.id, e.name, e.description, e.date, e.location, e.created_by_id, e.quantity, e.is_for_school, e.is_open, e.approval_status
    """, nativeQuery = true)
    //e.is_invite

    List<EventStatsDTO> getAllEventStats();
      // e.is_invite AS isInvite,
    // Lấy chi tiết event theo eventId, gom tên SPEAKER / GUEST
    @Query(value = """
    SELECT 
        e.id AS eventId,
      e.image_path AS imagePath,
        e.name AS eventName,
        e.description AS description,
        e.date AS date,
        e.mode AS eventMode,
        e.created_at AS createdAt,
        e.start_time AS startTime,
        e.duration_minutes AS durationMinutes,
        e.category_id AS category,
        e.qa_link AS qalink,
        e.join_link AS joinLink,                  
        e.location AS location,
        e.active AS active,
        e.approval_status AS approvalStatus,
        e.ticket_price AS ticketPrice,
        e.ticketed AS ticketed,
        e.created_by_id AS createdById,
        e.quantity AS quantity,
        
        e.is_for_school AS isForSchool,
        e.latitude AS latitude,
        e.longitude AS longitude,
        e.is_open AS isOpen,
        e.check_in_type AS checkInType,
        -- Danh sách SPEAKER (JSON array)
        CONCAT(
          '[', 
          IFNULL(
            GROUP_CONCAT(
              DISTINCT 
              CASE 
                WHEN s.role = 'SPEAKER' THEN 
                  JSON_OBJECT(
                    'id', s.id,
                    'name', s.name
                  )
                ELSE NULL
              END
              ORDER BY s.name SEPARATOR ','
            ), 
            ''
          ),
          ']'
        ) AS speakers,

        -- Danh sách GUEST (JSON array)
        CONCAT(
          '[', 
          IFNULL(
            GROUP_CONCAT(
              DISTINCT 
              CASE 
                WHEN s.role = 'GUEST' THEN 
                  JSON_OBJECT(
                    'id', s.id,
                    'name', s.name
                  )
                ELSE NULL
              END
              ORDER BY s.name SEPARATOR ','
            ), 
            ''
          ),
          ']'
        ) AS guests

    FROM events e
    LEFT JOIN speakers s ON e.id = s.event_id
    WHERE e.id = :eventId
    GROUP BY 
        e.id, e.name, e.description, e.date, 
        e.mode, e.created_at, e.start_time, 
        e.duration_minutes, e.category_id, e.qa_link, 
        e.join_link, e.location, e.active, e.approval_status, e.created_by_id,
        e.quantity, e.is_for_school, e.is_open, e.check_in_type
    """, nativeQuery = true)
    // e.is_invite

    Optional<EventGetNameDTO> getEventStatsById(Long eventId);


    @Query(value = """
    SELECT 
        e.id AS eventId,
        e.name AS eventName,
        u.name AS userName,
        u.student_id AS studentId,
        t.check_in_time AS checkInTime,
        t.check_out_time AS checkOutTime
    FROM events e
    JOIN tickets t ON e.id = t.event_id
    JOIN users u ON t.user_id = u.id
    WHERE e.id = :eventId
    ORDER BY u.student_id
    """, nativeQuery = true)
    List<EventAttendeeProjection> getEventAttendeesByEventId(Long eventId);

    @Query(value = """
    SELECT 
        e.id AS eventId,
        e.name AS eventName,
        e.date AS date,
        e.start_time AS startTime,
        e.location AS location,
        t.status AS status,
        t.check_in_time AS checkInTime,
        t.check_out_time AS checkOutTime,
        ei.status AS invitationStatus
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    LEFT JOIN event_invitations ei ON ei.event_id = e.id AND ei.invited_user_id = t.user_id
    WHERE t.user_id = :userId
    ORDER BY e.date DESC
    """, nativeQuery = true)
    List<UserEventHistoryProjection> getUserEventHistory(Long userId);
}
