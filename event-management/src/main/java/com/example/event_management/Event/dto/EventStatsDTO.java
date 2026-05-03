package com.example.event_management.Event.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public interface EventStatsDTO {
    Long getEventId();
    String getEventName();
    String getEventMode();
    Integer getDurationMinutes();
    String getCategory();
    LocalTime getStartTime();
    LocalDateTime getCreatedAt();
    String getDescription();
    LocalDate getDate();
    String getLocation();
    Integer getTicketCount();
    Integer getSpeakerCount();
    Integer getGuestCount();
    String getImagePath();
    Integer getActive();
    Boolean getTicketed();
    Long getTicketPrice();
    Long getCreatedById();
    Integer getQuantity();
    Boolean getIsInvite();
    Boolean getIsForSchool();
    Long getSchoolId();
    Boolean getIsOpen();
    Integer getApprovalStatus();
}
