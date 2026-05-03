package com.example.event_management.Ticket.dto;

import com.example.event_management.Ticket.entity.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketAttendanceDTO {
    private Long id;
    private Long userId;
    private String ticketCode;
    private String userName;
    private String userEmail;
    private String studentId;
    private Status status;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
}
