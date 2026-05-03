package com.example.event_management.Speaker.repository;

import com.example.event_management.Speaker.entity.Speaker;
import com.example.event_management.Speaker.entity.Role;
import com.example.event_management.Event.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpeakerRepository extends JpaRepository<Speaker, Long> {

    // Tìm tất cả speaker theo event
    List<Speaker> findByEvent(Event event);

    // Tìm speaker theo event ID
    List<Speaker> findByEventId(Long eventId);

    // Tìm theo vai trò (speaker hoặc guest)
    List<Speaker> findByRole(Role role);

    // Tìm theo tên (tìm gần đúng, không phân biệt hoa thường)
    List<Speaker> findByNameContainingIgnoreCase(String name);
}
