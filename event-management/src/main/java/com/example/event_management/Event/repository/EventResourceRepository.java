package com.example.event_management.Event.repository;

import com.example.event_management.Event.entity.EventResource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventResourceRepository extends JpaRepository<EventResource, Long> {

    @Query("SELECT r FROM EventResource r WHERE r.eventId = :eventId AND r.isDeleted = false ORDER BY r.createdAt DESC")
    List<EventResource> findByEventIdAndNotDeleted(@Param("eventId") Long eventId);

    @Query("SELECT r FROM EventResource r WHERE r.id = :id AND r.isDeleted = false")
    Optional<EventResource> findByIdAndNotDeleted(@Param("id") Long id);
}
