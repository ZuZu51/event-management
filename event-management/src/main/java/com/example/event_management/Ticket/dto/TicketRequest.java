package com.example.event_management.Ticket.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class TicketRequest {
    private Long userId;
    private Long eventId;
}
