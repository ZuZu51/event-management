package com.example.event_management.Attendance.dto;

import lombok.Data;

@Data
public class CheckInRequest {
    private Long sessionId; // nếu null -> tìm session active theo eventId
    private Long eventId;
}
