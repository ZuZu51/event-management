package com.example.event_management.Event.controller;

import com.example.event_management.Event.dto.EventInvitationDTO;
import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.entity.EventInvitation;
import com.example.event_management.Event.repository.EventInvitationRepository;
import com.example.event_management.Event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/students")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class StudentInvitationController {

    private final EventInvitationRepository invitationRepository;
    private final EventRepository eventRepository;

    /**
     * GET /students/{studentId}/invitations - Get all invitations for a student
     */
    @GetMapping("/{studentId}/invitations")
    public ResponseEntity<List<EventInvitationDTO>> getStudentInvitations(
            @PathVariable Long studentId) {
        List<EventInvitation> invitations = invitationRepository.findByInvitedUserId(studentId);
        
        List<EventInvitationDTO> dtos = invitations.stream()
                .map(invitation -> {
                    Event event = eventRepository.findById(invitation.getEventId()).orElse(null);
                    return EventInvitationDTO.from(invitation, event);
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }
}
