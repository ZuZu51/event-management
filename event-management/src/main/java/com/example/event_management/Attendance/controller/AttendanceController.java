package com.example.event_management.Attendance.controller;

import com.example.event_management.Attendance.dto.CheckInRequest;
import com.example.event_management.Attendance.dto.CheckOutRequest;
import com.example.event_management.Attendance.dto.SessionCreateDTO;
import com.example.event_management.Ticket.entity.Ticket;
import java.util.HashMap;
import java.util.Map;
import com.example.event_management.Attendance.entity.AttendanceSession;
import com.example.event_management.Attendance.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;

import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.User.entity.User;

import java.util.List;

@RestController
@RequestMapping("/attendance")
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final UserRepository userRepository;

    // Student endpoints
    @PostMapping("/checkin")
    public ResponseEntity<?> checkIn(@RequestParam Long userId, @RequestBody CheckInRequest req) {
        try {
            Ticket ticket = attendanceService.studentCheckIn(userId, req);
            Map<String, Object> out = new HashMap<>();
            out.put("id", ticket.getId());
            out.put("status", ticket.getStatus().name());
            out.put("checkInTime", ticket.getCheckInTime() != null ? ticket.getCheckInTime().toString() : null);
            out.put("eventId", ticket.getEvent() != null ? ticket.getEvent().getId() : null);
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/checkout")
    public ResponseEntity<?> checkOut(@RequestParam Long userId, @RequestBody CheckOutRequest req) {
        try {
            Ticket ticket = attendanceService.studentCheckOut(userId, req);
            Map<String, Object> out = new HashMap<>();
            out.put("id", ticket.getId());
            out.put("status", ticket.getStatus().name());
            out.put("checkOutTime", ticket.getCheckOutTime() != null ? ticket.getCheckOutTime().toString() : null);
            out.put("eventId", ticket.getEvent() != null ? ticket.getEvent().getId() : null);
            return ResponseEntity.ok(out);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/history/{userId}")
    public ResponseEntity<?> history(@PathVariable Long userId) {
        return ResponseEntity.ok(attendanceService.getUserHistory(userId));
    }

    @GetMapping("/user/today")
    public ResponseEntity<?> myTodayAttendance() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            java.util.Optional<User> uOpt = userRepository.findByEmail(username);
            if (uOpt.isEmpty())
                return ResponseEntity.status(401).body("User not found");
            Long userId = uOpt.get().getId();
            return ResponseEntity.ok(attendanceService.getTodayAttendance(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Admin endpoints
    @PostMapping("/admin/session")
    public ResponseEntity<?> createSession(@RequestBody SessionCreateDTO dto) {
        try {
            AttendanceSession s = attendanceService.createSession(dto);
            return ResponseEntity.ok(s);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/admin/session/{id}")
    public ResponseEntity<?> updateSession(@PathVariable Long id, @RequestBody SessionCreateDTO dto) {
        try {
            AttendanceSession s = attendanceService.updateSession(id, dto);
            return ResponseEntity.ok(s);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/admin/session/{id}/open")
    public ResponseEntity<?> openSession(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(attendanceService.openSession(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/admin/session/{id}/reopen")
    public ResponseEntity<?> reopenSession(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(attendanceService.reopenSession(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/admin/session/{id}/close")
    public ResponseEntity<?> closeSession(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(attendanceService.closeSession(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin/event/{eventId}/records")
    public ResponseEntity<?> getEventRecords(@PathVariable Long eventId) {
        try {
            var records = attendanceService.getRecordsByEventDTO(eventId);
            return ResponseEntity.ok(records);
        } catch (Exception e) {
            System.err.println("Error in getEventRecords: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {
                {
                    put("error", e.getMessage());
                    put("type", e.getClass().getName());
                }
            });
        }
    }

    @GetMapping("/admin/event/{eventId}/checkin-settings")
    public ResponseEntity<?> getEventCheckinSettings(@PathVariable Long eventId) {
        try {
            Map<String, Object> settings = attendanceService.getEventCheckinSettings(eventId);
            System.out.println("Settings retrieved: " + settings.toString());
            return ResponseEntity.ok(settings);
        } catch (Exception e) {
            System.err.println("Error in getEventCheckinSettings: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {
                {
                    put("error", e.getMessage());
                    put("type", e.getClass().getName());
                }
            });
        }
    }

    @PatchMapping("/admin/event/{eventId}/checkin-settings/{sessionId}")
    public ResponseEntity<?> updateEventCheckinSettings(
            @PathVariable Long eventId,
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> settings) {
        try {
            Map<String, Object> result = attendanceService.updateEventCheckinSettings(sessionId, settings);
            System.out.println("Settings updated: " + result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error in updateEventCheckinSettings: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {
                {
                    put("error", e.getMessage());
                    put("type", e.getClass().getName());
                }
            });
        }
    }

    @PatchMapping("/admin/event/{eventId}/checkin-settings")
    public ResponseEntity<?> updateEventCheckinSettingsByEventId(
            @PathVariable Long eventId,
            @RequestBody Map<String, String> settings) {
        try {
            System.out.println("PATCH /admin/event/" + eventId + "/checkin-settings called");
            System.out.println("Settings to update: " + settings);
            Map<String, Object> result = attendanceService.updateEventCheckinSettingsByEventId(eventId, settings);
            System.out.println("Settings updated: " + result);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.err.println("Error in updateEventCheckinSettingsByEventId: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new HashMap<String, String>() {
                {
                    put("error", e.getMessage());
                    put("type", e.getClass().getName());
                }
            });
        }
    }
}
