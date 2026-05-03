package com.example.event_management.Ticket.repository;

import com.example.event_management.Ticket.entity.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    // Tìm ticket theo ticketCode (nếu muốn check QR code)
    Optional<Ticket> findByTicketCode(String ticketCode);

    // Tìm tất cả ticket của một user
    Optional<Ticket> findByUserIdAndEventId(Long userId, Long eventId);

    List<Ticket> findByUserId(Long userId);

    List<Ticket> findByEventId(Long eventId);

    @Query("select t from Ticket t join fetch t.user where t.event.id = :eventId")
    List<Ticket> findByEventIdWithUser(@Param("eventId") Long eventId);

    boolean existsByUserIdAndEventId(Long userId, Long eventId);
}
