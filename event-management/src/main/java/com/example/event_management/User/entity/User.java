package com.example.event_management.User.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.LocalDate;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String googleId;

    @Column(nullable = false, unique = true)
    private String email;

    private String password;

    @Column(nullable = false)
    private String name;

    private String fullName;    // Họ và tên (từ form signup)

    private String avatar;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.STUDENT;  // Enum định nghĩa bên dưới

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime updatedAt = LocalDateTime.now();

    private LocalDateTime lastLogin;

    private boolean isFirstLogin = true;

    private LocalDate birthday = LocalDate.of(1900, 1, 1);

    private LocalDate dateOfBirth;  // Ngày sinh (từ form signup)

    @Column(length = 10)
    private String gender;         // Nam / Nữ / Khác (từ form signup)

    private boolean active = true;

    private boolean emailVerified = false;  // Xác minh email thành công

    private String studentId;   // Mã sinh viên

    private String teacherId;   // Mã giáo viên

    private String faculty;     // Khoa

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "school_id")
    @JsonIgnore  // ✅ Ignore lazy-loaded relationships during serialization
    private School school;      // Trường (từ form signup)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    @JsonIgnore  // ✅ Ignore lazy-loaded relationships during serialization
    private Department department;  // Khoa (từ form signup)

    // 🕒 Tự động set thời gian khi tạo và cập nhật
    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}