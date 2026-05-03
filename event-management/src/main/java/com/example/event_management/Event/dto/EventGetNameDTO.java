package com.example.event_management.Event.dto;

import java.time.LocalDateTime;
import java.time.LocalTime;

public interface EventGetNameDTO {
    Long getEventId();
    String getEventName();
    String getDescription();
    String getDate();
    String getLocation();
    Boolean getTicketed();
    Long getTicketPrice();


    // Mới: thông tin chi tiết speaker và guest (JSON string)
    String getSpeakers();
    String getGuests();

    String getImagePath();

    String getEventMode();
    Integer getDurationMinutes();
    String getCategory();
    LocalTime getStartTime();
    LocalDateTime getCreatedAt();
    String getQalink();
    Integer getActive();
    Long getCreatedById();
    String getJoinLink();
    Integer getQuantity();
    //Boolean getIsInvite();
    Boolean getIsForSchool();
    Boolean getIsOpen();
    Double getLatitude();
    Double getLongitude();
    Integer getRadiusMeters();
    String getCheckInType();

}
