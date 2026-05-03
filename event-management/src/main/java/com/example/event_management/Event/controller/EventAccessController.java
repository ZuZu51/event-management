package com.example.event_management.Event.controller;

import com.example.event_management.Event.dto.EventInvitationDTO;
import com.example.event_management.Event.dto.EventSchoolAccessDTO;
import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.entity.EventInvitation;
import com.example.event_management.Event.entity.EventSchoolAccess;
import com.example.event_management.Event.repository.EventInvitationRepository;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Event.repository.EventSchoolAccessRepository;
import com.example.event_management.User.entity.School;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.SchoolRepository;
import com.example.event_management.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/events")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class EventAccessController {

    private final EventInvitationRepository invitationRepository;
    private final EventSchoolAccessRepository schoolAccessRepository;
    private final EventRepository eventRepository;
    private final SchoolRepository schoolRepository;
    private final UserRepository userRepository;

    // ===== INVITATION ENDPOINTS =====

    /**
     * GET /events/{eventId}/invitations - Get all invitations for event
     */
    @GetMapping("/{eventId}/invitations")
    public ResponseEntity<List<EventInvitationDTO>> getInvitations(@PathVariable Long eventId) {
        List<EventInvitation> invitations = invitationRepository.findByEventId(eventId);
        List<EventInvitationDTO> dtos = invitations.stream()
                .map(EventInvitationDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * POST /events/{eventId}/invitations - Create invitation by email
     */
    @PostMapping("/{eventId}/invitations")
    public ResponseEntity<?> createInvitation(
            @PathVariable Long eventId,
            @RequestBody Map<String, String> request) {
        if (!eventRepository.existsById(eventId)) {
            return ResponseEntity.notFound().build();
        }

        String inviteeEmail = request.get("inviteeEmail");
        if (inviteeEmail == null || inviteeEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }

        // Find user by email
        return userRepository.findByEmail(inviteeEmail)
                .map(user -> {
                    Event event = eventRepository.findById(eventId).orElse(null);
                    if (event == null) {
                        return ResponseEntity.notFound().build();
                    }

                    // Get invited by user ID from request or use event creator
                    Long invitedByUserId = null;
                    if (request.containsKey("invitedByUserId")) {
                        try {
                            invitedByUserId = Long.parseLong(request.get("invitedByUserId"));
                        } catch (NumberFormatException e) {
                            // ignore invalid ID
                        }
                    }
                    // If not provided, use event creator
                    if (invitedByUserId == null) {
                        invitedByUserId = event.getCreatedById();
                    }

                    // Create and save invitation
                    EventInvitation invitation = EventInvitation.builder()
                            .eventId(eventId)
                            .invitedUserId(user.getId())
                            .invitedByUserId(invitedByUserId)
                            .status(EventInvitation.InvitationStatus.PENDING)
                            .expiresAt(LocalDateTime.now().plusDays(7)) // 7 days expiry
                            .build();

                    EventInvitation saved = invitationRepository.save(invitation);
                    return ResponseEntity.ok(EventInvitationDTO.from(saved, event));
                })
                .orElse(ResponseEntity.badRequest().body(Map.of("error", "User not found with this email")));
    }

    /**
     * DELETE /events/{eventId}/invitations/{invitationId} - Delete invitation
     */
    @DeleteMapping("/{eventId}/invitations/{invitationId}")
    public ResponseEntity<Void> deleteInvitation(
            @PathVariable Long eventId,
            @PathVariable Long invitationId) {
        invitationRepository.deleteById(invitationId);
        return ResponseEntity.noContent().build();
    }

    // ===== SCHOOL ACCESS ENDPOINTS =====

    /**
     * GET /events/{eventId}/school-access - Get all schools for event
     */
    @GetMapping("/{eventId}/school-access")
    public ResponseEntity<List<EventSchoolAccessDTO>> getSchoolAccess(@PathVariable Long eventId) {
        List<EventSchoolAccess> accesses = schoolAccessRepository.findByEventId(eventId);
        List<EventSchoolAccessDTO> dtos = accesses.stream()
                .map(EventSchoolAccessDTO::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * POST /events/{eventId}/school-access - Add school to event
     */
    @PostMapping("/{eventId}/school-access")
    public ResponseEntity<EventSchoolAccessDTO> addSchoolAccess(
            @PathVariable Long eventId,
            @RequestBody Map<String, Long> request) {
        return eventRepository.findById(eventId)
                .flatMap(event -> schoolRepository.findById(request.get("schoolId"))
                        .map(school -> {
                            EventSchoolAccess access = EventSchoolAccess.builder()
                                    .event(event)
                                    .school(school)
                                    .build();
                            
                            EventSchoolAccess saved = schoolAccessRepository.save(access);
                            return ResponseEntity.ok(EventSchoolAccessDTO.from(saved));
                        }))
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /events/{eventId}/school-access/{accessId} - Remove school from event
     */
    @DeleteMapping("/{eventId}/school-access/{accessId}")
    public ResponseEntity<Void> deleteSchoolAccess(
            @PathVariable Long eventId,
            @PathVariable Long accessId) {
        schoolAccessRepository.deleteById(accessId);
        return ResponseEntity.noContent().build();
    }
}
