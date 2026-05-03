package com.example.event_management.Attendance.service;

import com.example.event_management.Attendance.dto.CheckInRequest;
import com.example.event_management.Attendance.dto.CheckOutRequest;
import com.example.event_management.Attendance.dto.SessionCreateDTO;
import com.example.event_management.Attendance.dto.AttendanceRecordDTO;
import com.example.event_management.Attendance.entity.AttendanceSession;
import com.example.event_management.Ticket.entity.Ticket;

import java.util.List;

public interface AttendanceService {
    Ticket studentCheckIn(Long userId, CheckInRequest req) throws Exception;
    Ticket studentCheckOut(Long userId, CheckOutRequest req) throws Exception;
    List<Ticket> getUserHistory(Long userId);

    AttendanceSession createSession(SessionCreateDTO dto) throws Exception;
    AttendanceSession updateSession(Long sessionId, SessionCreateDTO dto) throws Exception;
    AttendanceSession openSession(Long sessionId) throws Exception;
    AttendanceSession reopenSession(Long sessionId) throws Exception;
    AttendanceSession closeSession(Long sessionId) throws Exception;

    List<Ticket> getRecordsByEvent(Long eventId);
    
    List<AttendanceRecordDTO> getRecordsByEventDTO(Long eventId);

    // Get today's attendance items for a user (for the dashboard widget)
    java.util.List<com.example.event_management.Attendance.dto.AttendanceItemDTO> getTodayAttendance(Long userId);

    // Get check-in/check-out settings for an event
    java.util.Map<String, Object> getEventCheckinSettings(Long eventId) throws Exception;

    // Update only check-in/check-out settings for a session (partial update)
    java.util.Map<String, Object> updateEventCheckinSettings(Long sessionId, java.util.Map<String, String> settings) throws Exception;

    // Update check-in/check-out settings by event ID
    java.util.Map<String, Object> updateEventCheckinSettingsByEventId(Long eventId, java.util.Map<String, String> settings) throws Exception;
}
