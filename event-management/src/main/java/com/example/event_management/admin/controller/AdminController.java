package com.example.event_management.admin.controller;

import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Ticket.entity.Ticket;
import com.example.event_management.Ticket.repository.TicketRepository;
import com.example.event_management.User.entity.Role;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Admin Controller - Handles all admin operations for user management
 * Endpoints for managing users, registrations, payments, attendance, and event history
 */
@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final EventRepository eventRepository;

    // ==================== USER MANAGEMENT ====================

    /**
     * GET /admin/users - Get all users
     */
    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * GET /admin/users/{userId} - Get user by ID
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Long userId) {
        Optional<User> user = userRepository.findById(userId);
        return user.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    /**
     * PUT /admin/users/{userId}/role - Update user role
     */
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        String roleStr = request.get("role");
        
        try {
            Role newRole = Role.valueOf(roleStr);
            user.setRole(newRole);
            User updated = userRepository.save(user);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid role: " + roleStr);
        }
    }

    /**
     * PUT /admin/users/{userId}/toggle-status - Toggle user active status
     */
    @PutMapping("/users/{userId}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        user.setActive(!user.isActive());
        User updated = userRepository.save(user);
        return ResponseEntity.ok(updated);
    }

    /**
     * DELETE /admin/users/{userId} - Delete user
     */
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<?> deleteUser(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        userRepository.deleteById(userId);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }

    /**
     * GET /admin/users/search - Search users by keyword (name or email)
     */
    @GetMapping("/users/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String keyword) {
        List<User> users = userRepository.findAll().stream()
                .filter(u -> u.getName().toLowerCase().contains(keyword.toLowerCase()) ||
                           u.getEmail().toLowerCase().contains(keyword.toLowerCase()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // ==================== REGISTRATION HISTORY ====================

    /**
     * GET /admin/registrations - Get all registrations (tickets)
     */
    @GetMapping("/registrations")
    public ResponseEntity<List<Map<String, Object>>> getAllRegistrations() {
        List<Ticket> tickets = ticketRepository.findAll();
        List<Map<String, Object>> registrations = tickets.stream()
                .map(this::ticketToRegistrationDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(registrations);
    }

    /**
     * GET /admin/registrations/user/{userId} - Get registrations for specific user
     */
    @GetMapping("/registrations/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getUserRegistrations(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOpt.get();
        List<Ticket> tickets = ticketRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(userId))
                .collect(Collectors.toList());
        
        List<Map<String, Object>> registrations = tickets.stream()
                .map(this::ticketToRegistrationDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(registrations);
    }

    // ==================== PAYMENT HISTORY ====================

    /**
     * GET /admin/payments - Get all payments
     */
    @GetMapping("/payments")
    public ResponseEntity<List<Map<String, Object>>> getAllPayments() {
        List<Ticket> tickets = ticketRepository.findAll();
        List<Map<String, Object>> payments = tickets.stream()
                .filter(t -> t.getCheckInTime() != null) // Only completed tickets
                .map(this::ticketToPaymentDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(payments);
    }

    /**
     * GET /admin/payments/user/{userId} - Get payments for specific user
     */
    @GetMapping("/payments/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getUserPayments(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Ticket> tickets = ticketRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(userId) && t.getCheckInTime() != null)
                .collect(Collectors.toList());
        
        List<Map<String, Object>> payments = tickets.stream()
                .map(this::ticketToPaymentDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(payments);
    }

    // ==================== ATTENDANCE HISTORY ====================

    /**
     * GET /admin/attendances - Get all attendance records
     */
    @GetMapping("/attendances")
    public ResponseEntity<List<Map<String, Object>>> getAllAttendances() {
        List<Ticket> tickets = ticketRepository.findAll();
        List<Map<String, Object>> attendances = tickets.stream()
                .map(this::ticketToAttendanceDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(attendances);
    }

    /**
     * GET /admin/attendances/user/{userId} - Get attendance for specific user
     */
    @GetMapping("/attendances/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getUserAttendances(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Ticket> tickets = ticketRepository.findByUserId(userId);
        
        List<Map<String, Object>> attendances = tickets.stream()
                .map(this::ticketToAttendanceDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(attendances);
    }

    // ==================== EVENT MANAGEMENT HISTORY ====================

    /**
     * GET /admin/event-history - Get all event history
     */
    @GetMapping("/event-history")
    public ResponseEntity<List<Map<String, Object>>> getAllEventHistory() {
        List<Event> events = eventRepository.findAll();
        List<Map<String, Object>> eventHistories = events.stream()
                .map(this::eventToHistoryDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(eventHistories);
    }

    /**
     * GET /admin/event-history/user/{userId} - Get event history for specific user (events created/modified)
     */
    @GetMapping("/event-history/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getUserEventHistory(@PathVariable Long userId) {
        Optional<User> userOpt = userRepository.findById(userId);
        
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Event> events = eventRepository.findAll().stream()
                .filter(e -> e.getCreatedById() != null && e.getCreatedById().equals(userId))
                .collect(Collectors.toList());
        
        List<Map<String, Object>> eventHistories = events.stream()
                .map(this::eventToHistoryDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(eventHistories);
    }

    /**
     * GET /admin/event-history/event/{eventId} - Get history for specific event
     */
    @GetMapping("/event-history/event/{eventId}")
    public ResponseEntity<List<Map<String, Object>>> getEventHistory(@PathVariable Long eventId) {
        Optional<Event> eventOpt = eventRepository.findById(eventId);
        
        if (eventOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Event event = eventOpt.get();
        List<Map<String, Object>> eventHistories = Collections.singletonList(
                eventToHistoryDTO(event)
        );
        
        return ResponseEntity.ok(eventHistories);
    }

    // ==================== DTO CONVERSION METHODS ====================

    private Map<String, Object> ticketToRegistrationDTO(Ticket ticket) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("ticketId", ticket.getId());
        dto.put("userId", ticket.getUser().getId());
        dto.put("userName", ticket.getUser().getName());
        dto.put("userEmail", ticket.getUser().getEmail());
        dto.put("eventId", ticket.getEvent().getId());
        dto.put("eventName", ticket.getEvent().getName());
        dto.put("registrationDate", ticket.getCheckInTime() != null ? ticket.getCheckInTime() : LocalDateTime.now());
        dto.put("price", ticket.getEvent().getTicketPrice() != null ? ticket.getEvent().getTicketPrice() : 0);
        dto.put("status", ticket.getStatus().toString());
        dto.put("ticketCode", ticket.getTicketCode());
        return dto;
    }

    private Map<String, Object> ticketToPaymentDTO(Ticket ticket) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("paymentId", ticket.getId());
        dto.put("userId", ticket.getUser().getId());
        dto.put("userName", ticket.getUser().getName());
        dto.put("userEmail", ticket.getUser().getEmail());
        dto.put("eventId", ticket.getEvent().getId());
        dto.put("eventName", ticket.getEvent().getName());
        dto.put("amount", ticket.getEvent().getTicketPrice() != null ? ticket.getEvent().getTicketPrice() : 0);
        dto.put("paymentDate", ticket.getCheckInTime() != null ? ticket.getCheckInTime() : LocalDateTime.now());
        dto.put("paymentMethod", "VNPAY");
        dto.put("status", "COMPLETED");
        dto.put("transactionCode", ticket.getTicketCode());
        return dto;
    }

    private Map<String, Object> ticketToAttendanceDTO(Ticket ticket) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("recordId", ticket.getId());
        dto.put("userId", ticket.getUser().getId());
        dto.put("userName", ticket.getUser().getName());
        dto.put("userEmail", ticket.getUser().getEmail());
        dto.put("eventId", ticket.getEvent().getId());
        dto.put("eventName", ticket.getEvent().getName());
        dto.put("checkInTime", ticket.getCheckInTime());
        dto.put("checkOutTime", ticket.getCheckOutTime());
        dto.put("location", ticket.getEvent().getLocation());
        dto.put("attendanceStatus", ticket.getStatus().toString());
        return dto;
    }

    private Map<String, Object> eventToHistoryDTO(Event event) {
        Map<String, Object> dto = new LinkedHashMap<>();
        dto.put("historyId", event.getId());
        dto.put("creatorId", event.getCreatedById() != null ? event.getCreatedById() : 0);
        
        // Get creator name if available
        String creatorName = "System";
        if (event.getCreatedById() != null) {
            Optional<User> creator = userRepository.findById(event.getCreatedById());
            creatorName = creator.map(User::getName).orElse("Unknown");
        }
        dto.put("creatorName", creatorName);
        
        dto.put("eventId", event.getId());
        dto.put("eventName", event.getName());
        dto.put("actionType", "CREATE"); // For now, always CREATE as we don't track detailed history
        dto.put("actionDate", event.getCreatedAt() != null ? event.getCreatedAt() : LocalDateTime.now());
        dto.put("eventStatus", event.getActive() != null && event.getActive() == 1 ? "ACTIVE" : "INACTIVE");
        return dto;
    }
}
