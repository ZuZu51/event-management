package com.example.event_management.User.repository;

import com.example.event_management.User.entity.Role;
import com.example.event_management.User.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByRole(Role role);

    // Tìm user theo Google ID
    Optional<User> findByGoogleId(String googleId);

    // Tìm user theo email
    Optional<User> findByEmail(String email);

    // Kiểm tra tồn tại theo email
    boolean existsByEmail(String email);

    // Kiểm tra tồn tại theo Google ID
    boolean existsByGoogleId(String googleId);

    // Kiểm tra tồn tại theo studentId
    boolean existsByStudentId(String studentId);

    // Kiểm tra tồn tại theo teacherId
    boolean existsByTeacherId(String teacherId);
}
