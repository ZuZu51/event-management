package com.example.event_management.Event.repository;

import com.example.event_management.Event.entity.EventSchoolAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EventSchoolAccessRepository extends JpaRepository<EventSchoolAccess, Long> {
    List<EventSchoolAccess> findByEventId(Long eventId);
}
