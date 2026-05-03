package com.example.event_management.Event.service;

import com.example.event_management.Event.dto.*;
import com.example.event_management.Event.entity.Event;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

public interface EventService {

    // 🟢 Tạo mới event
    Event createEvent(EventCreateDTO dto);

    // 🟢 Lấy event theo customId
    Optional<Event> getEventByCustomId(String customId);

    // 🟢 Cập nhật trạng thái active
    Event updateEventStatus(String customId, Integer status);

    // 🟢 Cập nhật trạng thái đăng ký (isOpen)
    Event updateEventIsOpen(Long eventId, Boolean isOpen);

    // 🟢 Cập nhật trạng thái duyệt sự kiện (approvalStatus)
    Event updateApprovalStatus(Long eventId, Integer approvalStatus);

    // 🟢 Cập nhật event
    Event updateEvent(Long customId, EventScheduleUpdateDTO dto);

    // 🟢 Xóa event theo customId
    void deleteEvent(String customId);

    // 🟢 Hủy event theo customId
    Event cancelEvent(String customId);

    // 🟢 Lấy thống kê tickets, speakers, guests cho tất cả event
    List<EventStatsDTO> getAllEventStats();

    // 🟢 Lấy chi tiết event (speaker & guest name)
    Optional<EventGetNameDTO> getEventStatsById(Long eventId);

    // Lấy event theo id (numeric)
    Optional<Event> getEventById(Long id);

    // Cập nhật cờ isAttendance cho event
    Event updateEventAttendanceById(Long eventId, boolean enabled);

    // 🟢 Lấy danh sách attendees của event (để xuất Excel hoặc thống kê)
    List<EventAttendeeDTO> getEventAttendeesByEventId(Long eventId);

    // 🟢 Lấy danh sách lịch sử event của 1 user
    List<UserEventDTO> getUserEvents(Long userId);

    // Lưu ảnh của event và trả về đường dẫn (relative URL)
    String storeEventImage(MultipartFile file);
}
