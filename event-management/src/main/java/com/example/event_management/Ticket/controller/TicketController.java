package com.example.event_management.Ticket.controller;

import com.example.event_management.Ticket.dto.TicketDTO;
import com.example.event_management.Ticket.dto.TicketAttendanceDTO;
import com.example.event_management.Ticket.dto.TicketRequest;
import com.example.event_management.Ticket.entity.Ticket;
import com.example.event_management.Ticket.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    // 🔹 1️⃣ Tạo ticket mới
    @PostMapping
    public ResponseEntity<?> createTicket(@RequestBody TicketRequest request) {
        try {
            Ticket ticket = ticketService.createTicket(request.getUserId(), request.getEventId());
            return ResponseEntity.ok(ticket);
        } catch (RuntimeException e) {
            String message = e.getMessage();

            if (message.contains("User not found") || message.contains("Event not found")) {
                return ResponseEntity.status(404).body(message); // Not Found
            } else if (message.contains("already registered")) {
                return ResponseEntity.status(409).body(message); // Conflict
            } else {
                return ResponseEntity.status(400).body(message); // Bad Request cho các lỗi khác
            }
        }
    }

    // 🔹 2️⃣ Lấy ticket theo ID
    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicketById(@PathVariable Long id) {
        return ticketService.getTicketById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 3️⃣ Lấy ticket theo mã ticket (QR code)
    @GetMapping("/code/{ticketCode}")
    public ResponseEntity<Ticket> getTicketByCode(@PathVariable String ticketCode) {
        return ticketService.getTicketByCode(ticketCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 4️⃣ Cập nhật trạng thái ticket tự động (check-in/check-out)
    @PostMapping("/update-status/{ticketCode}/{idEvent}")
    public ResponseEntity<?> updateTicketStatus(
            @PathVariable String ticketCode,
            @PathVariable Long idEvent) {
        try {
            TicketDTO ticketDTO = ticketService.updateTicketStatus(ticketCode, idEvent);
            return ResponseEntity.ok(ticketDTO);
        } catch (RuntimeException e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    // 🔹 5️⃣ Lấy tất cả ticket của một user
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<?>> getTicketsByUser(@PathVariable Long userId) {
        List<Ticket> tickets = ticketService.getTicketsByUser(userId);
        // Convert to minimal JSON-friendly structure to avoid Hibernate proxy serialization issues
        List<java.util.Map<String, Object>> result = tickets.stream().map(t -> {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            if (t.getEvent() != null) {
                java.util.Map<String, Object> ev = new java.util.HashMap<>();
                ev.put("id", t.getEvent().getId());
                m.put("event", ev);
            } else {
                m.put("event", null);
            }
            m.put("ticketCode", t.getTicketCode());
            m.put("status", t.getStatus());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // 🔹 6️⃣ Lấy tất cả ticket của một event
    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<?>> getTicketsByEvent(@PathVariable Long eventId) {
        List<Ticket> tickets = ticketService.getTicketsByEvent(eventId);
        System.out.println("Tickets for event " + eventId + ": " + tickets);
        // Convert to minimal JSON-friendly structure to avoid Hibernate proxy serialization issues
        List<java.util.Map<String, Object>> result = tickets.stream().map(t -> {
            java.util.Map<String, Object> m = new java.util.HashMap<>();
            m.put("id", t.getId());
            if (t.getEvent() != null) {
                java.util.Map<String, Object> ev = new java.util.HashMap<>();
                ev.put("id", t.getEvent().getId());
                m.put("event", ev);
            } else {
                m.put("event", null);
            }
            if (t.getUser() != null) {
                java.util.Map<String, Object> user = new java.util.HashMap<>();
                user.put("id", t.getUser().getId());
                user.put("name", t.getUser().getName());
                m.put("user", user);
            } else {
                m.put("user", null);
            }
            m.put("ticketCode", t.getTicketCode());
            m.put("status", t.getStatus());
            return m;
        }).toList();

        return ResponseEntity.ok(result);
    }

    // 🔹 6.5️⃣ Lấy danh sách điểm danh từ tickets (cho QR scanning)
    @GetMapping("/attendance/{eventId}")
    public ResponseEntity<List<TicketAttendanceDTO>> getEventAttendanceFromTickets(@PathVariable Long eventId) {
        List<TicketAttendanceDTO> attendance = ticketService.getEventAttendanceFromTickets(eventId);
        return ResponseEntity.ok(attendance);
    }

    // 🔹 7️⃣ Hủy vé (có kiểm tra điều kiện - trước 2 ngày sự kiện)
    @DeleteMapping("/{userId}/{eventId}")
    public ResponseEntity<?> cancelTicket(
            @PathVariable Long userId,
            @PathVariable Long eventId) {
        try {
            ticketService.cancelTicket(userId, eventId);
            return ResponseEntity.ok("Hủy vé thành công");
        } catch (RuntimeException e) {
            String message = e.getMessage();
            if (message.contains("Ticket not found")) {
                return ResponseEntity.status(404).body(message);
            } else if (message.contains("Không thể hủy vé")) {
                return ResponseEntity.status(400).body(message); // Bad request khi không đủ 2 ngày
            } else {
                return ResponseEntity.status(500).body("Lỗi hủy vé: " + message);
            }
        }
    }
}
