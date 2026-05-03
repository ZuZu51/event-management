package com.example.event_management.Event.websocket;

import com.example.event_management.Event.dto.EventStatsDTO;
import com.example.event_management.Event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class EventStatsPublisher {

    private final SimpMessagingTemplate messagingTemplate;
    private final EventRepository eventRepository; // lấy dữ liệu trực tiếp

    // Gửi thống kê mới đến tất cả client đã subscribe /topic/event-stats
    public void publish() {
        List<EventStatsDTO> stats = eventRepository.getAllEventStats();
        messagingTemplate.convertAndSend("/topic/event-stats", stats);
    }
}
