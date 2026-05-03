package com.example.event_management.Event.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UserEventDTO {
    private Long eventId;
    private String eventName;
    private String date;
    private String startTime;
    private String location;
    private String status;
    private String checkInTime;
    private String checkOutTime;
    private String invitationStatus;
}
