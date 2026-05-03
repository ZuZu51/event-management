package com.example.event_management.Event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class EventAttendeeDTO {
    private Long eventId;
    private String eventName;
    private String userName;
    private String studentId;
    private String checkInTime;
    private String checkOutTime;
}
