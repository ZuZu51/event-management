package com.example.event_management.Ticket.service;

import com.example.event_management.Ticket.dto.TicketDTO;
import com.example.event_management.Ticket.dto.TicketAttendanceDTO;
import com.example.event_management.Ticket.entity.Ticket;

import java.util.List;
import java.util.Optional;

public interface TicketService {

    // 🔹 Tạo ticket mới cho user và event
    Ticket createTicket(Long userId, Long eventId);

    // 🔹 Lấy ticket theo ID
    Optional<Ticket> getTicketById(Long id);

    // 🔹 Lấy ticket theo mã ticket (QR code)
    Optional<Ticket> getTicketByCode(String ticketCode);

    // 🔹 Cập nhật trạng thái ticket: NONE -> CHECKED_IN -> CHECKED_OUT
    TicketDTO updateTicketStatus(String ticketCode, Long idEvent);

    // 🔹 Lấy tất cả ticket của một user
    List<Ticket> getTicketsByUser(Long userId);

    // 🔹 Lấy tất cả ticket của một event
    List<Ticket> getTicketsByEvent(Long eventId);

    // 🔹 Lấy danh sách điểm danh từ tickets (cho QR scanning)
    List<TicketAttendanceDTO> getEventAttendanceFromTickets(Long eventId);

    // 🔹 Hủy vé (có kiểm tra điều kiện - trước 2 ngày sự kiện)
    void cancelTicket(Long userId, Long eventId);
}
