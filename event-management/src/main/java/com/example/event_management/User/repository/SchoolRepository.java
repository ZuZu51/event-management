package com.example.event_management.User.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.event_management.User.entity.School;
import java.util.List;

@Repository
public interface SchoolRepository extends JpaRepository<School, Long> {
    List<School> findByActiveTrue();
    School findByName(String name);
}
