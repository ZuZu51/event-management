package com.example.event_management.Event.dto;

import java.time.LocalDate;

import java.time.LocalTime;

public interface UserEventHistoryProjection {
    Long getEventId();
    String getEventName();
    LocalDate getDate();
    LocalTime getStartTime();
    String getLocation();
    String getStatus();
    java.time.LocalDateTime getCheckInTime();
    java.time.LocalDateTime getCheckOutTime();
    String getInvitationStatus();
    
}
