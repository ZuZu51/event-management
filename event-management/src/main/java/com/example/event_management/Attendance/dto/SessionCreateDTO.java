package com.example.event_management.Attendance.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class SessionCreateDTO {
    private Long eventId;
    private LocalTime checkInStart;
    private LocalTime checkInEnd;
    private LocalTime checkOutStart;
    private LocalTime checkOutEnd;
}
