package com.example.event_management.User.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdateUserInfoDTO {
    private String name;
    private String fullname;       // Họ và tên
    private String avatar;
    private LocalDate dateOfBirth;  // ngày sinh
    private String gender;
    private String studentId;
    private String teacherId;
    private Long schoolId;          // trường
    private Long departmentId;      // khoa
}
