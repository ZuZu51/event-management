package com.example.event_management.Attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AttendanceItemDTO {
    private Long eventId;
    private String eventName;
    private String date; // yyyy-MM-dd
    private String startTime; // HH:mm
    private String location;
    private String status; // pending | open | checked-in | checked-out | closed
    private String checkInTime; // ISO datetime or null
    private String checkOutTime; // ISO datetime or null
    private String windowStart; // HH:mm
    private String windowEnd; // HH:mm
    private String checkOutStart; // HH:mm
    private String checkOutEnd; // HH:mm
    private String reopenedCheckInUntil; // HH:mm or null
    private String reopenedCheckOutUntil; // HH:mm or null
    private Double latitude; // Location coordinates for distance check
    private Double longitude;
    private Integer radiusMeters;
}
