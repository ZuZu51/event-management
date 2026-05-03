package com.example.event_management.Attendance.dto;

import lombok.Data;

@Data
public class CheckOutRequest {
    private Long sessionId;
    private Long eventId;
}
