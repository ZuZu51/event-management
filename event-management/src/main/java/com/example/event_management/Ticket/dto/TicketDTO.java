package com.example.event_management.Ticket.dto;

import com.example.event_management.Ticket.entity.Status;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TicketDTO {
    private String ticketCode;
    private Status status;
    private LocalDateTime checkInTime;
    private LocalDateTime checkOutTime;
    private String eventName;
    private String userName;
}