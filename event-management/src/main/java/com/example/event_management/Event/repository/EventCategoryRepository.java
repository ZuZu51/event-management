package com.example.event_management.Event.repository;

import com.example.event_management.Event.entity.EventCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EventCategoryRepository extends JpaRepository<EventCategory, Long> {
    List<EventCategory> findByActiveTrue();
    Optional<EventCategory> findByValue(String value);
    boolean existsByValue(String value);
}
