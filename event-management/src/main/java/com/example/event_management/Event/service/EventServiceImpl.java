package com.example.event_management.Event.service;

import com.example.event_management.Attendance.entity.SessionStatus;
import com.example.event_management.Event.dto.*;
import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.entity.EventCategory;
import com.example.event_management.Event.entity.CheckInType;
import com.example.event_management.Event.entity.EventSchoolAccess;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Event.repository.EventCategoryRepository;
import com.example.event_management.Event.repository.EventSchoolAccessRepository;
import com.example.event_management.Event.websocket.EventStatsPublisher;
import com.example.event_management.Attendance.entity.AttendanceSession;
import com.example.event_management.Attendance.repository.AttendanceSessionRepository;
import com.example.event_management.Mail.service.EmailService;
import com.example.event_management.Ticket.entity.Ticket;
import com.example.event_management.Ticket.repository.TicketRepository;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.entity.School;
import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.User.repository.SchoolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.util.StringUtils;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

@Service
@RequiredArgsConstructor
public class EventServiceImpl implements EventService {

    private final EventRepository eventRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final EventCategoryRepository eventCategoryRepository;
    private final EventSchoolAccessRepository eventSchoolAccessRepository;
    private final SchoolRepository schoolRepository;
    private final AttendanceSessionRepository attendanceSessionRepository;
    private final EventStatsPublisher eventStatsPublisher;
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private final EmailService emailService;

    @Override
    public Event createEvent(EventCreateDTO dto) {
        // Fetch category from database
        EventCategory category = eventCategoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new RuntimeException("Category not found with Id: " + dto.getCategoryId()));

        // Build Event entity from DTO
        Event event = Event.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .durationMinutes(dto.getDurationMinutes())
                .location(dto.getLocation())
                .eventCategory(category)
                .organizer(dto.getOrganizer())
                .active(dto.getActive() != null ? dto.getActive() : 0)
                .approvalStatus(dto.getApprovalStatus() != null ? dto.getApprovalStatus() : 1) // Mặc định là 1 (Chưa gửi)
                .ticketed(dto.getTicketed() != null ? dto.getTicketed() : false)
                .ticketPrice(dto.getTicketPrice() != null ? dto.getTicketPrice() : 0L)
                .mode(dto.getMode())
                .joinLink(dto.getJoinLink())
                .qaLink(dto.getQaLink())
                .imagePath(dto.getImagePath())
                .imagePublicId(dto.getImagePublicId())
                .createdById(dto.getCreatedById())
                //.isAttendance(dto.getIsAttendance() != null ? dto.getIsAttendance() : false)
                .quantity(dto.getQuantity())
                //.isInvite(dto.getIsInvite() != null ? dto.getIsInvite() : false)
                .isForSchool(dto.getIsForSchool() != null ? dto.getIsForSchool() : false)
                .isOpen(dto.getIsOpen() != null ? dto.getIsOpen() : true)
                .checkInType(dto.getCheckInType() != null ? dto.getCheckInType() : CheckInType.NONE)
                .latitude(dto.getLatitude())
                .longitude(dto.getLongitude())
                .radiusMeters(dto.getRadiusMeters() != null ? dto.getRadiusMeters() : 200)
                .build();

        Event saved = eventRepository.save(event);

        // Lưu allowed schools nếu isForSchool = true
        if (dto.getIsForSchool() != null && dto.getIsForSchool() && 
            dto.getAllowedSchoolIds() != null && !dto.getAllowedSchoolIds().isEmpty()) {
            for (Long schoolId : dto.getAllowedSchoolIds()) {
                School school = schoolRepository.findById(schoolId)
                        .orElseThrow(() -> new RuntimeException("School not found with Id: " + schoolId));
                EventSchoolAccess access = EventSchoolAccess.builder()
                        .event(saved)
                        .school(school)
                        .build();
                eventSchoolAccessRepository.save(access);
            }
            System.out.println("✅ Lưu " + dto.getAllowedSchoolIds().size() + " trường cho sự kiện");
        }

        eventStatsPublisher.publish(); // 🔔 push ngay khi tạo
        return saved;
    }

    @Override
    public Optional<Event> getEventByCustomId(String customId) {
        return eventRepository.findByCustomId(customId);
    }

    @Override
    public Event updateEvent(Long id, EventScheduleUpdateDTO dto) {

        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with Id: " + id));

        // ✅ Lưu thông tin cũ để gửi email thông báo
        String oldDate = event.getDate() != null ? event.getDate().toString() : "N/A";
        String oldTime = event.getStartTime() != null ? event.getStartTime().toString() : "N/A";
        String oldLocation = event.getLocation() != null ? event.getLocation() : "N/A";

        // ✅ Cập nhật giá trị mới (mở rộng: cho phép cập nhật metadata)
        if (dto.getDate() != null) event.setDate(dto.getDate());
        if (dto.getStartTime() != null) event.setStartTime(dto.getStartTime());
        if (dto.getLocation() != null) event.setLocation(dto.getLocation());

        if (dto.getName() != null) event.setName(dto.getName());
        if (dto.getDescription() != null) event.setDescription(dto.getDescription());
        if (dto.getDurationMinutes() != null) event.setDurationMinutes(dto.getDurationMinutes());

        if (dto.getTicketed() != null) event.setTicketed(dto.getTicketed());
        if (dto.getTicketPrice() != null) event.setTicketPrice(dto.getTicketPrice());

        if (dto.getCategoryId() != null) {
            EventCategory category = eventCategoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found with Id: " + dto.getCategoryId()));
            event.setEventCategory(category);
        }
        if (dto.getMode() != null) event.setMode(dto.getMode());
        if (dto.getOrganizer() != null) event.setOrganizer(dto.getOrganizer());

        if (dto.getJoinLink() != null) event.setJoinLink(dto.getJoinLink());
        if (dto.getQaLink() != null) event.setQaLink(dto.getQaLink());

        if (dto.getQuantity() != null) event.setQuantity(dto.getQuantity());
        //if (dto.getIsInvite() != null) event.setIsInvite(dto.getIsInvite());
        if (dto.getIsForSchool() != null) event.setIsForSchool(dto.getIsForSchool());
        if (dto.getIsOpen() != null) event.setIsOpen(dto.getIsOpen());
        if (dto.getCheckInType() != null) event.setCheckInType(dto.getCheckInType());

        // Update image fields
        if (dto.getImagePath() != null) event.setImagePath(dto.getImagePath());
        if (dto.getImagePublicId() != null) event.setImagePublicId(dto.getImagePublicId());

        // Update location coordinates
        if (dto.getLatitude() != null) event.setLatitude(dto.getLatitude());
        if (dto.getLongitude() != null) event.setLongitude(dto.getLongitude());
        if (dto.getRadiusMeters() != null) event.setRadiusMeters(dto.getRadiusMeters());

        Event savedEvent = eventRepository.save(event);

        // ✅ Handle check-in times: update, create, or delete AttendanceSession based on CheckInType
        CheckInType checkInType = event.getCheckInType() != null ? event.getCheckInType() : CheckInType.NONE;
        
        if (CheckInType.NONE.equals(checkInType) || CheckInType.QR_SCAN.equals(checkInType)) {
            // Delete existing session if checkInType is NONE or QR_SCAN (no need for times)
            List<AttendanceSession> sessions = attendanceSessionRepository.findByEventId(savedEvent.getId());
            if (!sessions.isEmpty()) {
                attendanceSessionRepository.deleteAll(sessions);
                System.out.println("✅ Xóa session vì checkInType = NONE hoặc QR_SCAN");
            }
        } else if (dto.getCheckinStart() != null || dto.getCheckinEnd() != null ||
                dto.getCheckoutStart() != null || dto.getCheckoutEnd() != null) {
            // Create or update session for AUTO or BOTH (need times)
            List<AttendanceSession> sessions = attendanceSessionRepository.findByEventId(savedEvent.getId());
            System.out.println("Running 2 ...");
            if (!sessions.isEmpty()) {
                // Update existing session
                System.out.println("Running 3 ...");
                AttendanceSession session = sessions.get(0);
                if (dto.getCheckinStart() != null) session.setCheckInStart(dto.getCheckinStart());
                if (dto.getCheckinEnd() != null) session.setCheckInEnd(dto.getCheckinEnd());
                if (dto.getCheckoutStart() != null) session.setCheckOutStart(dto.getCheckoutStart());
                if (dto.getCheckoutEnd() != null) session.setCheckOutEnd(dto.getCheckoutEnd());
                attendanceSessionRepository.save(session);

                System.out.println("✅ Cập nhật thời gian điểm danh cho sự kiện");
            } else {
                // Create new session if check-in times are provided
                System.out.println("Running 4 ...");
                AttendanceSession newSession = AttendanceSession.builder()
                        .event(savedEvent)
                        .checkInStart(dto.getCheckinStart())
                        .checkInEnd(dto.getCheckinEnd())
                        .checkOutStart(dto.getCheckoutStart())
                        .checkOutEnd(dto.getCheckoutEnd())
                        .reopenedCheckInUntil(null)
                        .reopenedCheckOutUntil(null)
                        .status(SessionStatus.PENDING)
                        .build();
                System.out.println("Running 5 ...");
                attendanceSessionRepository.save(newSession);
                System.out.println("Running 6 ...");
                System.out.println("✅ Tạo session điểm danh mới cho sự kiện");
            }
        }

        // Update allowed schools if isForSchool = true
        if (dto.getIsForSchool() != null && dto.getIsForSchool() && 
            dto.getAllowedSchoolIds() != null && !dto.getAllowedSchoolIds().isEmpty()) {
            // Delete existing school access records
            List<EventSchoolAccess> existingAccess = eventSchoolAccessRepository.findByEventId(savedEvent.getId());
            if (!existingAccess.isEmpty()) {
                eventSchoolAccessRepository.deleteAll(existingAccess);
                System.out.println("✅ Xóa các trường cũ: " + existingAccess.size());
            }

            // Add new school access records
            for (Long schoolId : dto.getAllowedSchoolIds()) {
                School school = schoolRepository.findById(schoolId)
                        .orElseThrow(() -> new RuntimeException("School not found with Id: " + schoolId));
                EventSchoolAccess access = EventSchoolAccess.builder()
                        .event(savedEvent)
                        .school(school)
                        .build();
                eventSchoolAccessRepository.save(access);
            }
            System.out.println("✅ Lưu " + dto.getAllowedSchoolIds().size() + " trường cho sự kiện");
        }

        // ✅ Gửi email thông báo cho tất cả người tham gia
        List<Ticket> tickets = ticketRepository.findByEventId(savedEvent.getId());
        if (tickets.isEmpty()) {
            System.out.println("⚠️ Không có người tham gia nào để gửi email thông báo.");
            return savedEvent;
        }

        for (Ticket ticket : tickets) {
            User user = ticket.getUser();
            if (user == null || user.getEmail() == null) continue;

            String subject = "🔔 Thông báo cập nhật sự kiện: " + savedEvent.getName();
            String htmlBody = buildEmailBody(user, savedEvent, oldDate, oldTime, oldLocation);

            try {
                emailService.sendHtmlMessageWithImage(
                        user.getEmail(),
                        subject,
                        htmlBody,
                        null,
                        null
                );
                System.out.println("📩 Email cập nhật event gửi tới: " + user.getEmail());
            } catch (Exception e) {
                System.err.println("❌ Lỗi gửi email tới " + user.getEmail() + ": " + e.getMessage());
            }
        }

        // ✅ Gửi thông báo qua WebSocket (nếu có dashboard đang theo dõi)
        eventStatsPublisher.publish();

        return savedEvent;
    }

    /**
     * Tạo nội dung email HTML thân thiện, có định dạng rõ ràng.
     */
    private String buildEmailBody(User user, Event event, String oldDate, String oldTime, String oldLocation) {
        return """
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; 
                    border-radius: 10px; padding: 20px; background-color: #fafafa;'>
            <h2 style='color: #2c3e50;'>Xin chào %s,</h2>
            <p style='font-size: 16px;'>Sự kiện bạn đã đăng ký 
               <b style='color: #2980b9;'>%s</b> vừa được cập nhật:</p>

            <ul style='font-size: 16px; line-height: 1.6;'>
                <li><b>📅 Ngày cũ:</b> %s → <b>Ngày mới:</b> %s</li>
                <li><b>🕒 Giờ cũ:</b> %s → <b>Giờ mới:</b> %s</li>
                <li><b>📍 Địa điểm cũ:</b> %s → <b>Địa điểm mới:</b> %s</li>
            </ul>

            <p style='font-size: 16px;'>Vui lòng chú ý thay đổi này để đến tham dự đúng thời gian 
               và địa điểm mới nhất.</p>

            <hr style='margin-top: 20px;'>
            <p style='font-size: 14px; color: #555;'>Trân trọng,<br><b>Hệ thống Event Management</b></p>
        </div>
    """.formatted(
                user.getName(),
                event.getName(),
                oldDate, event.getDate(),
                oldTime, event.getStartTime(),
                oldLocation, event.getLocation()
        );
    }

    @Override
    public Event cancelEvent(String customId) {
        Optional<Event> optionalEvent = eventRepository.findById(Long.valueOf(customId));
        if (optionalEvent.isEmpty()) {
            throw new RuntimeException("Event not found with customId: " + customId);
        }

        Event event = optionalEvent.get();
        event.setActive(0); // 🔴 Trạng thái: hủy
        event.setIsOpen(false); // ❌ Đóng đăng ký khi hủy sự kiện
        Event savedEvent = eventRepository.save(event);

        // ✅ Lấy danh sách người có vé
        List<Ticket> tickets = ticketRepository.findByEventId(savedEvent.getId());
        if (tickets.isEmpty()) {
            System.out.println("⚠️ Không có người tham gia nào để gửi email huỷ sự kiện.");
        } else {
            for (Ticket ticket : tickets) {
                User user = ticket.getUser();
                if (user == null || user.getEmail() == null) continue;

                String subject = "⚠️ Thông báo huỷ sự kiện: " + savedEvent.getName();
                String htmlBody = buildCancelEmailBody(user, savedEvent);

                try {
                    emailService.sendHtmlMessageWithImage(
                            user.getEmail(),
                            subject,
                            htmlBody,
                            null,
                            null
                    );
                    System.out.println("📩 Email huỷ sự kiện gửi tới: " + user.getEmail());
                } catch (Exception e) {
                    System.err.println("❌ Lỗi gửi email huỷ tới " + user.getEmail() + ": " + e.getMessage());
                }
            }
        }

        // 🔔 Gửi cập nhật WebSocket (Dashboard, thống kê)
        eventStatsPublisher.publish();

        return savedEvent;
    }

    /**
     * 📨 Nội dung email huỷ sự kiện
     */
    private String buildCancelEmailBody(User user, Event event) {
        return """
    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f5c6cb; 
                border-radius: 10px; padding: 20px; background-color: #f8d7da;'>
        <h2 style='color: #721c24;'>Xin chào %s,</h2>
        <p style='font-size: 16px;'>Chúng tôi rất tiếc phải thông báo rằng sự kiện 
           <b style='color: #c82333;'>%s</b> đã bị <b>hủy bỏ</b>.</p>

        <p style='font-size: 16px;'>Mọi thông tin vé và lịch trình liên quan đến sự kiện này hiện không còn hiệu lực.</p>

        <p style='font-size: 15px;'>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ ban tổ chức để được hỗ trợ.</p>

        <hr style='margin-top: 20px;'>
        <p style='font-size: 14px; color: #555;'>Trân trọng,<br><b>Hệ thống Event Management</b></p>
    </div>
    """.formatted(user.getName(), event.getName());
    }


    @Override
    public void deleteEvent(String customId) {
        Optional<Event> optionalEvent = eventRepository.findByCustomId(customId);
        optionalEvent.ifPresent(eventRepository::delete);
    }

    @Override
    public List<EventStatsDTO> getAllEventStats() {
        // Lấy dữ liệu từ repository
        List<EventStatsDTO> stats = eventRepository.getAllEventStats();

        // Đẩy dữ liệu qua WebSocket đến các client đã subscribe
        eventStatsPublisher.publish();

        // Trả dữ liệu cho REST client
        return stats;
    }

    @Override
    public Event updateEventStatus(String customId, Integer status) {
        Optional<Event> optionalEvent = eventRepository.findByCustomId(customId);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            event.setActive(status);
            Event saved = eventRepository.save(event);

            // 🔔 Gửi update qua WebSocket
            eventStatsPublisher.publish();

            return saved;
        }
        throw new RuntimeException("Event not found with customId: " + customId);
    }

    @Override
    public Event updateEventIsOpen(Long eventId, Boolean isOpen) {
        Optional<Event> optionalEvent = eventRepository.findById(eventId);
        if (optionalEvent.isPresent()) {
            Event event = optionalEvent.get();
            event.setIsOpen(isOpen);
            Event saved = eventRepository.save(event);

            // 🔔 Gửi update qua WebSocket
            eventStatsPublisher.publish();

            return saved;
        }
        throw new RuntimeException("Event not found with eventId: " + eventId);
    }

    @Override
    public Optional<EventGetNameDTO> getEventStatsById(Long eventId) {
        return eventRepository.getEventStatsById(eventId);
    }

    @Override
    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }

    @Override
    public Event updateEventAttendanceById(Long eventId, boolean enabled) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));

        //event.setIsAttendance(enabled);
        Event saved = eventRepository.save(event);

        // Optionally publish stats if UI depends on this change
        eventStatsPublisher.publish();

        return saved;
    }

    @Override
    public Event updateApprovalStatus(Long eventId, Integer approvalStatus) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with Id: " + eventId));
        
        event.setApprovalStatus(approvalStatus);
        Event saved = eventRepository.save(event);
        
        // Optionally publish stats if UI depends on this change
        eventStatsPublisher.publish();
        
        return saved;
    }

    public List<EventAttendeeDTO> getEventAttendeesByEventId(Long eventId) {
        return eventRepository.getEventAttendeesByEventId(eventId)
                .stream()
                .map(p -> new EventAttendeeDTO(
                        p.getEventId(),
                        p.getEventName(),
                        p.getUserName(),
                        p.getStudentId(),
                        p.getCheckInTime() != null ? p.getCheckInTime().format(DATE_TIME_FORMATTER) : "",
                        p.getCheckOutTime() != null ? p.getCheckOutTime().format(DATE_TIME_FORMATTER) : ""
                ))
                .toList();
    }

    @Override
    public List<UserEventDTO> getUserEvents(Long userId) {
        return eventRepository.getUserEventHistory(userId)
                .stream()
                .map(p -> new UserEventDTO(
                        p.getEventId(),
                        p.getEventName(),
                        p.getDate() != null ? p.getDate().toString() : "",
                        p.getStartTime() != null ? p.getStartTime().toString() : "",
                        p.getLocation(),
                        p.getStatus(),
                        p.getCheckInTime() != null ? p.getCheckInTime().format(DATE_TIME_FORMATTER) : "",
                        p.getCheckOutTime() != null ? p.getCheckOutTime().format(DATE_TIME_FORMATTER) : "",
                        p.getInvitationStatus()
                ))
                .toList();
    }

    @Override
    public String storeEventImage(MultipartFile file) {
        if (file == null || file.isEmpty()) return null;

        try {
            String uploadsDir = System.getProperty("user.dir") + File.separator + "uploads";
            File dir = new File(uploadsDir);
            if (!dir.exists()) dir.mkdirs();

            String originalFilename = StringUtils.cleanPath(file.getOriginalFilename());
            String filename = System.currentTimeMillis() + "_" + originalFilename;

            Path targetLocation = Paths.get(uploadsDir).toAbsolutePath().resolve(filename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            // Return a relative URL that the frontend can request (served by resource handler)
            return "/uploads/" + filename;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}
