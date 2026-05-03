package com.example.event_management.Attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AttendanceRecordDTO {
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private String checkInAt;
    private String checkOutAt;
    private String status; // CHECKED_IN, CHECKED_OUT, ABSENT
}
