package com.example.event_management.User.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String googleId;
    private String email;
    private String fullname;
    private LocalDate dateOfBirth;
    private String gender;
    private String studentId;
    private String teacherId;
    private String avatar;
    private SchoolSimpleDTO school;
    private DepartmentSimpleDTO department;
    private String role;
    private boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SchoolSimpleDTO {
        private Long id;
        private String name;
        private String code;
        private String city;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DepartmentSimpleDTO {
        private Long id;
        private String name;
        private String code;
        private Long schoolId;
    }
}
