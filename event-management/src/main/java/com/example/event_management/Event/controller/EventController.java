package com.example.event_management.Event.controller;

import com.example.event_management.Event.dto.*;
import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.entity.EventSchoolAccess;
import com.example.event_management.Event.excel.ExcelExporter;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Event.repository.EventSchoolAccessRepository;
import com.example.event_management.Event.service.EventService;
import com.example.event_management.Speaker.dto.SpeakerRequest;
import com.example.event_management.Speaker.entity.Speaker;
import com.example.event_management.Speaker.service.SpeakerService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.event_management.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/events")
public class EventController {

    @Autowired
    private EventService eventService;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private EventSchoolAccessRepository eventSchoolAccessRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private SpeakerService speakerService;

    // Tạo mới event
    @PostMapping
    public ResponseEntity<Event> createEvent(@RequestBody EventCreateDTO dto, HttpServletRequest request) {
        // Try to populate createdById from JWT (if present)
        try {
            String auth = request.getHeader("Authorization");
            if (auth != null && auth.startsWith("Bearer ")) {
                String token = auth.substring(7);
                Long userId = jwtTokenProvider.getUserIdFromToken(token);
                if (userId != null) {
                    dto.setCreatedById(userId);
                    System.out.println("✅ Set createdById: " + userId);
                } else {
                    System.out.println("⚠️ getUserIdFromToken returned null");
                }
            } else {
                System.out.println("⚠️ Authorization header missing or invalid");
            }
        } catch (Exception e) {
            System.err.println("❌ Error setting createdById: " + e.getMessage());
            e.printStackTrace();
            // If anything goes wrong while extracting user id, continue without setting it
            // (safety: do not block event creation)
        }

        Event createdEvent = eventService.createEvent(dto);
        return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
    }

    // Lấy event theo customId
    @GetMapping("/{customId}")
    public ResponseEntity<Event> getEventByCustomId(@PathVariable String customId) {
        Optional<Event> eventOptional = eventService.getEventByCustomId(customId);
        return eventOptional
                .map(event -> new ResponseEntity<>(event, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // Cập nhật trạng thái active
    @PatchMapping("/{customId}/status")
    public ResponseEntity<Event> updateEventStatus(
            @PathVariable String customId,
            @RequestParam Integer status
    ) {
        try {
            Event updatedEvent = eventService.updateEventStatus(customId, status);
            return new ResponseEntity<>(updatedEvent, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Cập nhật trạng thái đăng ký (isOpen)
    @PatchMapping("/{eventId}/registration")
    public ResponseEntity<Event> updateEventIsOpen(
            @PathVariable Long eventId,
            @RequestBody Map<String, Boolean> body
    ) {
        try {
            Boolean isOpen = body.get("isOpen");
            if (isOpen == null) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            Event updatedEvent = eventService.updateEventIsOpen(eventId, isOpen);
            return new ResponseEntity<>(updatedEvent, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Cập nhật trạng thái duyệt sự kiện (approvalStatus)
    @PatchMapping("/{eventId}/approval-status")
    public ResponseEntity<Event> updateApprovalStatus(
            @PathVariable Long eventId,
            @RequestBody Map<String, Integer> body
    ) {
        try {
            Integer approvalStatus = body.get("approvalStatus");
            if (approvalStatus == null) {
                return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
            }
            Event updatedEvent = eventService.updateApprovalStatus(eventId, approvalStatus);
            return new ResponseEntity<>(updatedEvent, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Cập nhật toàn bộ thông tin event
    @PutMapping("/{customId}")
    public ResponseEntity<Event> updateEvent(
            @PathVariable Long customId,
            @RequestBody EventScheduleUpdateDTO updatedEvent
    ) {
        try {
            System.out.println("xxx..."+ updatedEvent.getCheckInType());
            Event event = eventService.updateEvent(customId, updatedEvent);
            return new ResponseEntity<>(event, HttpStatus.OK);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    @PutMapping("/cancel/{customId}")
    public ResponseEntity<Event> cancelEvent(@PathVariable String customId) {
        Event cancelledEvent = eventService.cancelEvent(customId);
        return ResponseEntity.ok(cancelledEvent);
    }

    // Xóa event theo customId
    @DeleteMapping("/{customId}")
    public ResponseEntity<Void> deleteEvent(@PathVariable String customId) {
        eventService.deleteEvent(customId);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    // Xóa event theo eventId (Long)
    @DeleteMapping("/id/{eventId}")
    public ResponseEntity<Void> deleteEventById(@PathVariable Long eventId) {
        Optional<Event> event = eventRepository.findById(eventId);
        if (event.isPresent()) {
            eventService.deleteEvent(event.get().getCustomId());
        }
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }

    @GetMapping
    public ResponseEntity<List<EventStatsDTO>> getAllEventStats() {
        List<EventStatsDTO> stats = eventService.getAllEventStats();
        return new ResponseEntity<>(stats, HttpStatus.OK);
    }

    // Lấy chi tiết event theo eventId (thống kê SPEAKER / GUEST)
    @GetMapping("/stats/{eventId}")
    public ResponseEntity<EventGetNameDTO> getEventStatsById(@PathVariable Long eventId) {
        Optional<EventGetNameDTO> optionalStats = eventService.getEventStatsById(eventId);
        return optionalStats
                .map(stats -> new ResponseEntity<>(stats, HttpStatus.OK))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @GetMapping("/{eventId}/attendees/export")
    public ResponseEntity<byte[]> exportAttendeesToExcel(@PathVariable Long eventId) {
        try {
            List<EventAttendeeDTO> attendees = eventService.getEventAttendeesByEventId(eventId);
            String eventName = attendees.isEmpty() ? "Unknown Event" : attendees.get(0).getEventName();

            byte[] excelData = ExcelExporter.exportAttendeesToExcel(eventName, attendees);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=attendees_event_" + eventId + ".xlsx")
                    .body(excelData);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user/{userId}/events")
    public ResponseEntity<List<UserEventDTO>> getUserEvents(@PathVariable Long userId) {
        return ResponseEntity.ok(eventService.getUserEvents(userId));
    }

    @PostMapping("/{eventId}/speakers")
    public ResponseEntity<List<Speaker>> createSpeakersForEvent(
            @PathVariable Long eventId,
            @RequestBody List<SpeakerRequest> requests) {
        try {
            List<Speaker> speakers = speakerService.createSpeakerForEvent(eventId, requests);
            return ResponseEntity.status(HttpStatus.CREATED).body(speakers);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }

    // Lấy trạng thái isAttendance cho event (by numeric id)
    @GetMapping("/{eventId}/attendance")
    public ResponseEntity<?> getAttendanceFlag(@PathVariable Long eventId) {
        Optional<Event> optional = eventService.getEventById(eventId);
        return optional.map(event -> ResponseEntity.ok().body(new java.util.HashMap<String, Object>() {{
            //put("isAttendance", event.getIsAttendance());
            put("createdById", event.getCreatedById());
        }}))
                .orElseGet(() -> new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    // Cập nhật isAttendance (on/off)
        @PatchMapping("/{eventId}/attendance")
        @PreAuthorize("hasAnyRole('ADMIN','TEACHER') or @eventSecurity.isOwner(authentication, #eventId)")
    public ResponseEntity<Event> updateAttendanceFlag(
            @PathVariable Long eventId,
            @RequestParam boolean enabled
    ) {
        try {
            Event updated = eventService.updateEventAttendanceById(eventId, enabled);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
    }

    // Lấy danh sách schools của một event (cho sự kiện sinh viên trường)
    @GetMapping("/{eventId}/schools")
    @PreAuthorize("permitAll()") // Public access - danh sách schools của event là public info
    public ResponseEntity<List<EventSchoolAccess>> getEventSchools(@PathVariable Long eventId) {
        try {
            List<EventSchoolAccess> schools = eventSchoolAccessRepository.findByEventId(eventId);
            return ResponseEntity.ok(schools);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Lấy danh sách school IDs của một event (cho form chỉnh sửa)
    @GetMapping("/{eventId}/allowed-schools")
    @PreAuthorize("permitAll()") // Public access
    public ResponseEntity<List<Long>> getAllowedSchoolIds(@PathVariable Long eventId) {
        try {
            List<EventSchoolAccess> schools = eventSchoolAccessRepository.findByEventId(eventId);
            List<Long> schoolIds = schools.stream()
                    .map(access -> access.getSchool().getId())
                    .toList();
            return ResponseEntity.ok(schoolIds);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

}
