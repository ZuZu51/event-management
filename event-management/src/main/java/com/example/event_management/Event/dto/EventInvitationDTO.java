package com.example.event_management.Event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.event_management.Event.entity.EventInvitation;
import com.example.event_management.Event.entity.Event;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventInvitationDTO {
    private Long id;
    private Long eventId;
    private Long invitedUserId;
    private String inviteeEmail;
    private String invitedByEmail;
    private String eventName;
    private LocalDate eventDate;
    private String status;
    private LocalDateTime invitedAt;
    private LocalDateTime acceptedAt;
    private LocalDateTime expiresAt;
    private String rejectionReason;

    public static EventInvitationDTO from(EventInvitation entity) {
        return EventInvitationDTO.builder()
                .id(entity.getId())
                .eventId(entity.getEventId())
                .invitedUserId(entity.getInvitedUserId())
                .inviteeEmail(entity.getInvitedUser() != null ? entity.getInvitedUser().getEmail() : "")
                .invitedByEmail(entity.getInvitedByUser() != null ? entity.getInvitedByUser().getEmail() : "")
                .status(entity.getStatus().toString())
                .invitedAt(entity.getInvitedAt())
                .acceptedAt(entity.getAcceptedAt())
                .expiresAt(entity.getExpiresAt())
                .rejectionReason(entity.getRejectionReason())
                .build();
    }

    public static EventInvitationDTO from(EventInvitation entity, Event event) {
        return EventInvitationDTO.builder()
                .id(entity.getId())
                .eventId(entity.getEventId())
                .invitedUserId(entity.getInvitedUserId())
                .inviteeEmail(entity.getInvitedUser() != null ? entity.getInvitedUser().getEmail() : "")
                .invitedByEmail(entity.getInvitedByUser() != null ? entity.getInvitedByUser().getEmail() : "")
                .eventName(event != null ? event.getName() : "")
                .eventDate(event != null ? event.getDate() : null)
                .status(entity.getStatus().toString())
                .invitedAt(entity.getInvitedAt())
                .acceptedAt(entity.getAcceptedAt())
                .expiresAt(entity.getExpiresAt())
                .rejectionReason(entity.getRejectionReason())
                .build();
    }
}
