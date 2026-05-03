package com.example.event_management.Attendance.service;

import com.example.event_management.Attendance.dto.CheckInRequest;
import com.example.event_management.Attendance.dto.CheckOutRequest;
import com.example.event_management.Attendance.dto.SessionCreateDTO;
import com.example.event_management.Attendance.entity.AttendanceSession;
import com.example.event_management.Attendance.entity.SessionStatus;
import com.example.event_management.Attendance.repository.AttendanceSessionRepository;
import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Mail.service.EmailService;
import com.example.event_management.Ticket.repository.TicketRepository;
import com.example.event_management.Ticket.entity.Ticket;
import com.example.event_management.Ticket.entity.Status;

import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class AttendanceServiceImpl implements AttendanceService {

    private static final Logger log = LoggerFactory.getLogger(AttendanceServiceImpl.class);

    private final AttendanceSessionRepository sessionRepository;
    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional
    public Ticket studentCheckIn(Long userId, CheckInRequest req) throws Exception {
        AttendanceSession session = resolveSessionForAction(req);
        if (session == null)
            throw new IllegalArgumentException("Session not found");

        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Get or create ticket for this user & event
        Optional<Ticket> existingTicket = ticketRepository.findByUserIdAndEventId(userId, session.getEvent().getId());
        if (existingTicket.isEmpty() && session.getEvent().getTicketed()) {
            throw new IllegalStateException("User not registered / does not have ticket for this event");
        }

        Ticket ticket = existingTicket.orElseGet(() -> {
            Ticket newTicket = Ticket.builder()
                    .user(user)
                    .event(session.getEvent())
                    .status(Status.NONE)

                    .build();
            return ticketRepository.save(newTicket);
        });

        LocalTime now = LocalTime.now();
        LocalDateTime nowDt = LocalDateTime.now();

        // Check duplicate
        if (ticket.getStatus() == Status.CHECKED_IN || ticket.getStatus() == Status.CHECKED_OUT) {
            throw new IllegalStateException("Duplicate check-in");
        }

        // time window checks
        if (session.getStatus() != SessionStatus.ACTIVE) {
            throw new IllegalStateException("Session is not active");
        }

        boolean inWindow = isWithin(session.getCheckInStart(), session.getCheckInEnd(), now);
        if (!inWindow) {
            // Check if within reopened window
            LocalTime reopenUntil = session.getReopenedCheckInUntil();
            if (reopenUntil == null || now.isAfter(reopenUntil)) {
                throw new IllegalStateException("Not in check-in window");
            }
        }

        // Update ticket
        ticket.setCheckInTime(nowDt);
        ticket.setStatus(Status.CHECKED_IN);


        Ticket saved = ticketRepository.save(ticket);

        // notify front-end
        messagingTemplate.convertAndSend("/topic/attendance",
                "User " + user.getId() + " checked in for session " + session.getId());

        return saved;
    }

    @Override
    @Transactional
    public Ticket studentCheckOut(Long userId, CheckOutRequest req) throws Exception {
        AttendanceSession session = resolveSessionForAction(req);
        if (session == null)
            throw new IllegalArgumentException("Session not found");

        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));

        Ticket ticket = ticketRepository.findByUserIdAndEventId(userId, session.getEvent().getId())
                .orElseThrow(() -> new IllegalStateException("User hasn't checked-in yet"));

        if (ticket.getStatus() == Status.CHECKED_OUT) {
            throw new IllegalStateException("Duplicate check-out");
        }

        if (ticket.getStatus() != Status.CHECKED_IN) {
            throw new IllegalStateException("User hasn't checked-in yet");
        }

        LocalTime now = LocalTime.now();
        LocalDateTime nowDt = LocalDateTime.now();

        if (!isWithin(session.getCheckOutStart(), session.getCheckOutEnd(), now)) {
            // Check if within reopened window
            LocalTime reopenUntil = session.getReopenedCheckOutUntil();
            if (reopenUntil == null || now.isAfter(reopenUntil)) {
                throw new IllegalStateException("Not in check-out window");
            }
        }

        ticket.setCheckOutTime(nowDt);
        ticket.setStatus(Status.CHECKED_OUT);
        Ticket saved = ticketRepository.save(ticket);

        messagingTemplate.convertAndSend("/topic/attendance",
                "User " + user.getId() + " checked out for session " + session.getId());

        return saved;
    }

    @Override
    public List<Ticket> getUserHistory(Long userId) {
        return ticketRepository.findByUserId(userId);
    }

    @Override
    @Transactional
    public AttendanceSession createSession(SessionCreateDTO dto) throws Exception {
        Event event = eventRepository.findById(dto.getEventId())
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        AttendanceSession s = AttendanceSession.builder()
                .event(event)
                .checkInStart(dto.getCheckInStart())
                .checkInEnd(dto.getCheckInEnd())
                .checkOutStart(dto.getCheckOutStart())
                .checkOutEnd(dto.getCheckOutEnd())
                .status(SessionStatus.PENDING)
                .build();

        return sessionRepository.save(s);
    }

    @Override
    @Transactional
    public AttendanceSession updateSession(Long sessionId, SessionCreateDTO dto) throws Exception {
        AttendanceSession s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        s.setCheckInStart(dto.getCheckInStart());
        s.setCheckInEnd(dto.getCheckInEnd());
        s.setCheckOutStart(dto.getCheckOutStart());
        s.setCheckOutEnd(dto.getCheckOutEnd());
        return sessionRepository.save(s);
    }

    @Override
    @Transactional
    public AttendanceSession openSession(Long sessionId) throws Exception {
        AttendanceSession s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        if (s.getStatus() == SessionStatus.ACTIVE)
            throw new IllegalStateException("Session already active");
        s.setStatus(SessionStatus.ACTIVE);
        AttendanceSession saved = sessionRepository.save(s);
        messagingTemplate.convertAndSend("/topic/attendance", "Session " + s.getId() + " opened");
        System.out.printf("Check data:", s, SessionStatus.ACTIVE);
        return saved;
    }

    @Override
    @Transactional
    public AttendanceSession reopenSession(Long sessionId) throws Exception {
        AttendanceSession s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        
        // Check-in reopen: session must be ACTIVE with deadline set
        if (s.getStatus() == SessionStatus.ACTIVE) {
            if (s.getReopenedCheckInUntil() == null) {
                throw new IllegalStateException("Cannot reopen check-in: no deadline set");
            }
            return s; // Deadline already active
        }
        
        // Check-out reopen: session must be CLOSED with deadline set
        if (s.getStatus() == SessionStatus.CLOSED) {
            if (s.getReopenedCheckOutUntil() == null) {
                throw new IllegalStateException("Cannot reopen check-out: no deadline set");
            }
            s.setStatus(SessionStatus.ACTIVE);
            AttendanceSession saved = sessionRepository.save(s);
            messagingTemplate.convertAndSend("/topic/attendance", "Session " + s.getId() + " reopened for check-out");
            return saved;
        }
        
        throw new IllegalStateException("Invalid session status for reopening");
    }

    @Override
    @Transactional
    public AttendanceSession closeSession(Long sessionId) throws Exception {
        AttendanceSession s = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        s.setStatus(SessionStatus.CLOSED);
        AttendanceSession saved = sessionRepository.save(s);
        messagingTemplate.convertAndSend("/topic/attendance", "Session " + s.getId() + " closed");
        return saved;
    }

    @Override
    public List<Ticket> getRecordsByEvent(Long eventId) {
        return ticketRepository.findByEventId(eventId);
    }

    public List<com.example.event_management.Attendance.dto.AttendanceRecordDTO> getRecordsByEventDTO(Long eventId) {
        List<Ticket> tickets = ticketRepository.findByEventId(eventId);

        return tickets.stream()
                .map(ticket -> com.example.event_management.Attendance.dto.AttendanceRecordDTO.builder()
                        .id(ticket.getId())
                        .userId(ticket.getUser().getId())
                        .userName(ticket.getUser().getName())
                        .userEmail(ticket.getUser().getEmail())
                        .checkInAt(ticket.getCheckInTime() != null ? ticket.getCheckInTime().toString() : null)
                        .checkOutAt(ticket.getCheckOutTime() != null ? ticket.getCheckOutTime().toString() : null)
                        .status(ticket.getStatus().name())
                        .build())
                .toList();
    }

    @Override
    public java.util.List<com.example.event_management.Attendance.dto.AttendanceItemDTO> getTodayAttendance(
            Long userId) {
        LocalDate today = LocalDate.now();
        List<com.example.event_management.Attendance.dto.AttendanceItemDTO> out = new java.util.ArrayList<>();
        java.time.format.DateTimeFormatter timeFmt = java.time.format.DateTimeFormatter.ofPattern("HH:mm");
        java.time.format.DateTimeFormatter dtFmt = java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME;

        // find tickets for user
        List<Ticket> tickets = ticketRepository.findByUserId(userId);
        for (Ticket ticket : tickets) {
            Event event = ticket.getEvent();
            if (event == null)
                continue;
            if (!today.equals(event.getDate()))
                continue; // only today's events

            // default fields
            String windowStart = null;
            String windowEnd = null;
            String status = "pending";
            String checkInTime = null;
            String checkOutTime = null;
            String checkOutStart = null;
            String checkOutEnd = null;
            String reopenedCheckInUntil = null;
            String reopenedCheckOutUntil = null;

            List<AttendanceSession> sessions = sessionRepository.findByEventId(event.getId());
            if (sessions.isEmpty()) {
                status = "pending";
                windowStart = event.getStartTime().format(timeFmt);
                windowEnd = event.getStartTime().format(timeFmt);
            } else {
                AttendanceSession session = sessions.get(0);
                windowStart = session.getCheckInStart() != null ? session.getCheckInStart().format(timeFmt)
                        : event.getStartTime().format(timeFmt);
                windowEnd = session.getCheckInEnd() != null ? session.getCheckInEnd().format(timeFmt)
                        : event.getStartTime().format(timeFmt);
                checkOutStart = session.getCheckOutStart() != null ? session.getCheckOutStart().format(timeFmt) : null;
                checkOutEnd = session.getCheckOutEnd() != null ? session.getCheckOutEnd().format(timeFmt) : null;
                reopenedCheckInUntil = session.getReopenedCheckInUntil() != null ? session.getReopenedCheckInUntil().format(timeFmt) : null;
                reopenedCheckOutUntil = session.getReopenedCheckOutUntil() != null ? session.getReopenedCheckOutUntil().format(timeFmt) : null;

                if (session.getStatus() == SessionStatus.PENDING) {
                    status = "pending";
                } else if (session.getStatus() == SessionStatus.ACTIVE) {
                    if (ticket.getStatus() == Status.CHECKED_OUT) {
                        status = "checked-out";
                    } else if (ticket.getStatus() == Status.CHECKED_IN) {
                        status = "checked-in";
                    } else {
                        status = "open";
                    }
                    if (ticket.getCheckInTime() != null)
                        checkInTime = ticket.getCheckInTime().format(dtFmt);
                    if (ticket.getCheckOutTime() != null)
                        checkOutTime = ticket.getCheckOutTime().format(dtFmt);
                } else if (session.getStatus() == SessionStatus.CLOSED) {
                    if (ticket.getStatus() == Status.CHECKED_OUT) {
                        status = "checked-out";
                    } else if (ticket.getStatus() == Status.CHECKED_IN) {
                        status = "checked-in";
                    } else {
                        status = "closed";
                    }
                    if (ticket.getCheckInTime() != null)
                        checkInTime = ticket.getCheckInTime().format(dtFmt);
                    if (ticket.getCheckOutTime() != null)
                        checkOutTime = ticket.getCheckOutTime().format(dtFmt);
                }
            }

            com.example.event_management.Attendance.dto.AttendanceItemDTO dto = new com.example.event_management.Attendance.dto.AttendanceItemDTO(
                    event.getId(),
                    event.getName(),
                    event.getDate().toString(),
                    event.getStartTime().format(timeFmt),
                    event.getLocation(),
                    status,
                    checkInTime,
                    checkOutTime,
                    windowStart,
                    windowEnd,
                    checkOutStart,
                    checkOutEnd,
                    reopenedCheckInUntil,
                    reopenedCheckOutUntil,
                    event.getLatitude(),
                    event.getLongitude(),
                    event.getRadiusMeters());
            out.add(dto);
        }

        return out;
    }

    private boolean isWithin(LocalTime start, LocalTime end, LocalTime now) {
        if (start == null || end == null)
            return false;
        return !now.isBefore(start) && !now.isAfter(end);
    }

    private AttendanceSession resolveSessionForAction(Object req) {
        if (req instanceof CheckInRequest) {
            CheckInRequest r = (CheckInRequest) req;
            if (r.getSessionId() != null)
                return sessionRepository.findById(r.getSessionId()).orElse(null);
            if (r.getEventId() != null) {
                // find active session for event today
                Event event = eventRepository.findById(r.getEventId()).orElse(null);
                if (event == null)
                    return null;
                LocalDate today = LocalDate.now();
                List<AttendanceSession> list = sessionRepository.findByEventId(r.getEventId());
                return list.stream()
                        .filter(s -> s.getEvent().getDate().equals(today) && s.getStatus() == SessionStatus.ACTIVE)
                        .findFirst().orElse(null);
            }
        } else if (req instanceof CheckOutRequest) {
            CheckOutRequest r = (CheckOutRequest) req;
            if (r.getSessionId() != null)
                return sessionRepository.findById(r.getSessionId()).orElse(null);
            if (r.getEventId() != null) {
                Event event = eventRepository.findById(r.getEventId()).orElse(null);
                if (event == null)
                    return null;
                LocalDate today = LocalDate.now();
                List<AttendanceSession> list = sessionRepository.findByEventId(r.getEventId());
                return list.stream()
                        .filter(s -> s.getEvent().getDate().equals(today) && s.getStatus() == SessionStatus.ACTIVE)
                        .findFirst().orElse(null);
            }
        }
        return null;
    }

    @Override
    public java.util.Map<String, Object> getEventCheckinSettings(Long eventId) throws Exception {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));

        List<AttendanceSession> sessions = sessionRepository.findByEventId(eventId);

        if (!sessions.isEmpty()) {
            AttendanceSession session = sessions.get(0);
            java.util.Map<String, Object> settings = new java.util.HashMap<>();
            settings.put("enabled", true);
            settings.put("checkInType", event.getCheckInType() != null ? event.getCheckInType().toString() : "NONE");
            settings.put("checkinStart",
                    session.getCheckInStart() != null ? session.getCheckInStart().toString() : "08:00");
            settings.put("checkinEnd", session.getCheckInEnd() != null ? session.getCheckInEnd().toString() : "09:00");
            settings.put("checkoutStart",
                    session.getCheckOutStart() != null ? session.getCheckOutStart().toString() : "17:00");
            settings.put("checkoutEnd",
                    session.getCheckOutEnd() != null ? session.getCheckOutEnd().toString() : "18:00");
            settings.put("reopenedCheckInUntil", session.getReopenedCheckInUntil() != null ? session.getReopenedCheckInUntil().toString() : null);
            settings.put("reopenedCheckOutUntil", session.getReopenedCheckOutUntil() != null ? session.getReopenedCheckOutUntil().toString() : null);
            settings.put("sessionId", session.getId());
            return settings;
        }

        java.util.Map<String, Object> settings = new java.util.HashMap<>();
        settings.put("enabled", true);
        settings.put("checkInType", event.getCheckInType() != null ? event.getCheckInType().toString() : "NONE");

        try {
            if (event.getStartTime() != null) {
                LocalTime checkinStart = event.getStartTime().minusHours(1);
                LocalTime checkinEnd = event.getStartTime();
                LocalTime checkoutStart = event.getStartTime();

                if (event.getDurationMinutes() != null && event.getDurationMinutes() > 0) {
                    checkoutStart = event.getStartTime().plusMinutes(event.getDurationMinutes());
                } else {
                    checkoutStart = event.getStartTime().plusHours(2);
                }

                LocalTime checkoutEnd = checkoutStart.plusHours(1);

                settings.put("checkinStart", checkinStart.toString());
                settings.put("checkinEnd", checkinEnd.toString());
                settings.put("checkoutStart", checkoutStart.toString());
                settings.put("checkoutEnd", checkoutEnd.toString());
            } else {
                settings.put("checkinStart", "08:00");
                settings.put("checkinEnd", "09:00");
                settings.put("checkoutStart", "17:00");
                settings.put("checkoutEnd", "18:00");
            }
            settings.put("reopenedCheckInUntil", null);
            settings.put("reopenedCheckOutUntil", null);
        } catch (Exception e) {
            log.error("Error calculating times from event", e);
            settings.put("checkinStart", "08:00");
            settings.put("checkinEnd", "09:00");
            settings.put("checkoutStart", "17:00");
            settings.put("checkoutEnd", "18:00");
            settings.put("reopenedCheckInUntil", null);
            settings.put("reopenedCheckOutUntil", null);
        }

        return settings;
    }

    @Override
    @Transactional
    public java.util.Map<String, Object> updateEventCheckinSettings(Long sessionId,
            java.util.Map<String, String> settings) throws Exception {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));

        if (settings.containsKey("checkinStart")) {
            session.setCheckInStart(LocalTime.parse(settings.get("checkinStart")));
        }
        if (settings.containsKey("checkinEnd")) {
            session.setCheckInEnd(LocalTime.parse(settings.get("checkinEnd")));
        }
        if (settings.containsKey("checkoutStart")) {
            session.setCheckOutStart(LocalTime.parse(settings.get("checkoutStart")));
        }
        if (settings.containsKey("checkoutEnd")) {
            session.setCheckOutEnd(LocalTime.parse(settings.get("checkoutEnd")));
        }
        if (settings.containsKey("reopenedCheckInUntil")) {
            String reopenCheckIn = settings.get("reopenedCheckInUntil");
            session.setReopenedCheckInUntil(reopenCheckIn != null && !reopenCheckIn.isEmpty() ? LocalTime.parse(reopenCheckIn) : null);
        }
        if (settings.containsKey("reopenedCheckOutUntil")) {
            String reopenCheckOut = settings.get("reopenedCheckOutUntil");
            session.setReopenedCheckOutUntil(reopenCheckOut != null && !reopenCheckOut.isEmpty() ? LocalTime.parse(reopenCheckOut) : null);
        }

        AttendanceSession updated = sessionRepository.save(session);
        System.out.println("xxx..." + updated.getReopenedCheckInUntil());
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("enabled", true);
        result.put("checkinStart", updated.getCheckInStart() != null ? updated.getCheckInStart().toString() : "08:00");
        result.put("checkinEnd", updated.getCheckInEnd() != null ? updated.getCheckInEnd().toString() : "09:00");
        result.put("checkoutStart",
                updated.getCheckOutStart() != null ? updated.getCheckOutStart().toString() : "17:00");
        result.put("checkoutEnd", updated.getCheckOutEnd() != null ? updated.getCheckOutEnd().toString() : "18:00");
        result.put("reopenedCheckInUntil", updated.getReopenedCheckInUntil() != null ? updated.getReopenedCheckInUntil().toString() : null);
        result.put("reopenedCheckOutUntil", updated.getReopenedCheckOutUntil() != null ? updated.getReopenedCheckOutUntil().toString() : null);
        result.put("sessionId", updated.getId());

        return result;
    }

    @Transactional
    public java.util.Map<String, Object> updateEventCheckinSettingsByEventId(Long eventId,
            java.util.Map<String, String> settings) throws Exception {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new IllegalArgumentException("Event not found"));
        
        List<AttendanceSession> sessions = sessionRepository.findByEventId(eventId);
        if (sessions.isEmpty()) {
            throw new IllegalArgumentException("No attendance session found for event");
        }
        
        AttendanceSession session = sessions.get(0);
        
        if (settings.containsKey("checkinStart")) {
            session.setCheckInStart(LocalTime.parse(settings.get("checkinStart")));
        }
        if (settings.containsKey("checkinEnd")) {
            session.setCheckInEnd(LocalTime.parse(settings.get("checkinEnd")));
        }
        if (settings.containsKey("checkoutStart")) {
            session.setCheckOutStart(LocalTime.parse(settings.get("checkoutStart")));
        }
        if (settings.containsKey("checkoutEnd")) {
            session.setCheckOutEnd(LocalTime.parse(settings.get("checkoutEnd")));
        }
        if (settings.containsKey("reopenedCheckInUntil")) {
            String reopenCheckIn = settings.get("reopenedCheckInUntil");
            session.setReopenedCheckInUntil(reopenCheckIn != null && !reopenCheckIn.isEmpty() ? LocalTime.parse(reopenCheckIn) : null);
        }
        if (settings.containsKey("reopenedCheckOutUntil")) {
            String reopenCheckOut = settings.get("reopenedCheckOutUntil");
            session.setReopenedCheckOutUntil(reopenCheckOut != null && !reopenCheckOut.isEmpty() ? LocalTime.parse(reopenCheckOut) : null);
        }

        AttendanceSession updated = sessionRepository.save(session);

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("enabled", true);
        result.put("checkinStart", updated.getCheckInStart() != null ? updated.getCheckInStart().toString() : "08:00");
        result.put("checkinEnd", updated.getCheckInEnd() != null ? updated.getCheckInEnd().toString() : "09:00");
        result.put("checkoutStart",
                updated.getCheckOutStart() != null ? updated.getCheckOutStart().toString() : "17:00");
        result.put("checkoutEnd", updated.getCheckOutEnd() != null ? updated.getCheckOutEnd().toString() : "18:00");
        result.put("reopenedCheckInUntil", updated.getReopenedCheckInUntil() != null ? updated.getReopenedCheckInUntil().toString() : null);
        result.put("reopenedCheckOutUntil", updated.getReopenedCheckOutUntil() != null ? updated.getReopenedCheckOutUntil().toString() : null);
        result.put("sessionId", updated.getId());

        return result;
    }
}
