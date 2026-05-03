package com.example.event_management.Mail.controller;

import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Ticket.entity.Ticket;
import com.example.event_management.Ticket.repository.TicketRepository;
import com.example.event_management.Mail.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// Dev controller disabled in repo. If you need to re-enable, restore @RestController and @RequestMapping
// @RestController
// @RequestMapping("/admin/dev-mail")
@RequiredArgsConstructor
@Deprecated
public class DevMailController {

    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final EmailService emailService;

    // Dev-only endpoint: trigger reminder emails for a specific event immediately
    @PostMapping("/send-reminder/{eventId}")
    public ResponseEntity<?> sendReminderNow(@PathVariable Long eventId) {
        Event e = eventRepository.findById(eventId).orElse(null);
        if (e == null) return ResponseEntity.notFound().build();

        List<Ticket> tickets = ticketRepository.findByEventId(e.getId());
        for (Ticket t : tickets) {
            try {
                String subject = "Nhắc: Sự kiện sẽ diễn ra vào ngày mai - " + e.getName();
                String htmlBody = """
                        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #fafafa;'>
                            <h2 style='color: #2c3e50;'>Xin chào %s,</h2>
                            <p style='font-size: 16px;'>Đây là lời nhắc: sự kiện <b style='color: #2980b9;'>%s</b> sẽ diễn ra vào ngày mai.</p>
                            <p style='font-size: 16px;'><b>📅 Ngày:</b> %s</p>
                            <p style='font-size: 16px;'><b>⏰ Thời gian:</b> %s</p>
                            <p style='font-size: 16px;'><b>📍 Địa điểm:</b> %s</p>
                            <hr style='margin-top: 20px;'>
                            <p style='font-size: 14px; color: #555;'>Nếu bạn có thắc mắc, hãy liên hệ với ban tổ chức hoặc kiểm tra trang sự kiện trong hệ thống.</p>
                        </div>
                        """.formatted(t.getUser().getName(), e.getName(), e.getDate().toString(), e.getStartTime().toString(), e.getLocation());

                emailService.sendHtmlMessageWithImage(t.getUser().getEmail(), subject, htmlBody, null, null);
            } catch (Exception ex) {
                // ignore
            }
        }

        return ResponseEntity.ok("Triggered reminder send for event " + eventId);
    }
}
