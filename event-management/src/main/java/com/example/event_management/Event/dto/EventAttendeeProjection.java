package com.example.event_management.Event.dto;

import java.time.LocalDateTime;

public interface EventAttendeeProjection {
    Long getEventId();
    String getEventName();
    String getUserName();
    String getStudentId();
    LocalDateTime getCheckInTime();
    LocalDateTime getCheckOutTime();
}