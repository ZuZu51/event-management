package com.example.event_management.Attendance.scheduler;

import com.example.event_management.Attendance.entity.AttendanceSession;
import com.example.event_management.Attendance.entity.SessionStatus;
import com.example.event_management.Attendance.repository.AttendanceSessionRepository;
import com.example.event_management.Attendance.service.AttendanceService;
import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Ticket.entity.Ticket;
import com.example.event_management.Ticket.repository.TicketRepository;
import com.example.event_management.Mail.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class AttendanceScheduler {

    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final AttendanceService attendanceService;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final AttendanceSessionRepository sessionRepository;

    @Scheduled(cron = "0 * * * * *")
    public void checkAllSessions() {
        runForPeriod();
    }

    private void runForPeriod() {
        LocalDate today = LocalDate.now();
        List<Event> events = eventRepository.findAll();
        for (Event e : events) {
            if (!e.getDate().equals(today))
                continue;

            try {
                System.out.println("Running...");
                // Check if session exists
                List<AttendanceSession> existingSessions = sessionRepository.findByEventId(e.getId());
                if (!existingSessions.isEmpty()) {
                    AttendanceSession existing = existingSessions.get(0);
                    LocalTime currentTime = LocalTime.now();
                    System.out.print("Status: " + existing.getStatus());
                    // Open if PENDING
                    if (existing.getStatus() == SessionStatus.PENDING) {
                        System.out.println("Running 2...");
                        try {
                            attendanceService.openSession(existing.getId());
                            System.out.println("✅ Opened PENDING → ACTIVE: " + existing.getId());
                        } catch (Exception ex) {
                            System.err.println("❌ Error opening: " + ex.getMessage());
                        }
                    }

                    // Close if ACTIVE and time passed checkOutEnd (or reopened deadline)
                    if (existing.getStatus() == SessionStatus.ACTIVE && existing.getCheckOutEnd() != null) {
                        // Use reopened deadline if set, otherwise use normal checkOutEnd
                        LocalTime closeTime = (existing.getReopenedCheckOutUntil() != null) 
                            ? existing.getReopenedCheckOutUntil() 
                            : existing.getCheckOutEnd();
                        
                        if (!currentTime.isBefore(closeTime)) {
                            try {
                                attendanceService.closeSession(existing.getId());
                                System.out.println("✅ Closed ACTIVE → CLOSED: " + existing.getId());
                            } catch (Exception ex) {
                                System.err.println("❌ Error closing: " + ex.getMessage());
                            }
                        }
                    }
                }
            } catch (Exception ex) {
                System.err.println("❌ Error processing session: " + ex.getMessage());
            }

        }
    }

    /*
     * private void runForPeriod(LocalTime start, LocalTime end) {
     * LocalDate today = LocalDate.now();
     * List<Event> events = eventRepository.findAll();
     * for (Event e : events) {
     * if (!e.getDate().equals(today))
     * continue;
     * LocalTime st = e.getStartTime();
     * System.out.println(st + " " + start + " " + st + " " + (end) + " " +
     * st.compareTo(start) + " " + st.compareTo(end));
     * if (st.compareTo(start) >= 0 && st.compareTo(end) < 0) {
     * try {
     * 
     * System.out.println("Running...");
     * // Check if session exists
     * List<AttendanceSession> existingSessions =
     * sessionRepository.findByEventId(e.getId());
     * if (!existingSessions.isEmpty()) {
     * AttendanceSession existing = existingSessions.get(0);
     * LocalTime currentTime = LocalTime.now();
     * System.out.print("Status: " + existing.getStatus());
     * // Open if PENDING
     * if (existing.getStatus() == SessionStatus.PENDING) {
     * System.out.println("Running 2...");
     * try {
     * attendanceService.openSession(existing.getId());
     * System.out.println("✅ Opened PENDING → ACTIVE: " + existing.getId());
     * } catch (Exception ex) {
     * System.err.println("❌ Error opening: " + ex.getMessage());
     * }
     * }
     * 
     * // Close if ACTIVE and time passed checkOutEnd + 5min
     * if (existing.getStatus() == SessionStatus.ACTIVE && existing.getCheckOutEnd()
     * != null) {
     * LocalTime closeTime = existing.getCheckOutEnd();
     * if (!currentTime.isBefore(closeTime)) {
     * try {
     * attendanceService.closeSession(existing.getId());
     * System.out.println("✅ Closed ACTIVE → CLOSED: " + existing.getId());
     * } catch (Exception ex) {
     * System.err.println("❌ Error closing: " + ex.getMessage());
     * }
     * }
     * }
     * }
     * } catch (Exception ex) {
     * System.err.println("❌ Error processing session: " + ex.getMessage());
     * }
     * }
     * }
     * }
     */

    // Daily reminder: send email to attendees when event is 1 day away
    @Scheduled(cron = "${attendance.cron.reminder:0 0 8 * * *}")
    public void dailyReminder() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        List<Event> events = eventRepository.findAll();
        for (Event e : events) {
            try {
                if (!e.getDate().equals(tomorrow))
                    continue;

                List<Ticket> tickets = ticketRepository.findByEventIdWithUser(e.getId());
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
                                """
                                .formatted(t.getUser().getName(), e.getName(), e.getDate().toString(),
                                        e.getStartTime().toString(), e.getLocation());

                        emailService.sendHtmlMessageWithImage(t.getUser().getEmail(), subject, htmlBody, null, null);
                    } catch (Exception ex) {
                        ex.printStackTrace();
                        System.err.println("❌ Lỗi gửi reminder cho ticket id=" + (t != null ? t.getId() : "?") + ": "
                                + ex.getMessage());
                    }
                }
            } catch (Exception ex) {
                // continue on errors for other events
            }
        }
    }
}
