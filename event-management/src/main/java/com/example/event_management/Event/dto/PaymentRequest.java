package com.example.event_management.Event.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private int ticketPrice;
    private String idEvent;
    private Long idUser;
}