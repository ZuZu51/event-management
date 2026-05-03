package com.example.event_management.configuration;

import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Slf4j
@Component
@EnableScheduling
@RequiredArgsConstructor
public class EventStatusScheduler {

    private final EventRepository eventRepository;

    /**
     * Cấu hình chạy mỗi 5 phút (300_000 ms)
     */
    @Scheduled(fixedRate = 300_000)
    public void updateEventStatus() {
        log.info("🔄 Bắt đầu cập nhật trạng thái event...");

        List<Event> events = eventRepository.findAll();
        LocalDateTime now = LocalDateTime.now();

        for (Event event : events) {
            try {
                LocalDate eventDate = event.getDate();
                LocalTime eventStartTime = event.getStartTime();
                LocalDateTime eventStartDateTime = LocalDateTime.of(eventDate, eventStartTime);

                int currentActive = event.getActive();
                int newActive = currentActive; // giá trị mặc định

                // Nếu ngày hiện tại lớn hơn event.date + 1 ngày
                if (now.toLocalDate().isAfter(eventDate.plusDays(1))) {
                    newActive = 3;
                }
                // Nếu thời gian >= startTime + 5 tiếng
                else if (now.isAfter(eventStartDateTime.plusHours(5))) {
                    newActive = 3;
                }
                // Nếu thời gian >= startTime + 1 phút
                else if (now.isAfter(eventStartDateTime.plusMinutes(1))) {
                    newActive = 2;
                }
                // Còn lại mặc định là 1
                else {
                    newActive = 1;
                }

                if (newActive != currentActive) {
                    event.setActive(newActive);
                    eventRepository.save(event);
                    log.info("✅ Cập nhật event [{} - {}] -> active = {}", event.getId(), event.getName(), newActive);
                }

            } catch (Exception e) {
                log.error("❌ Lỗi khi cập nhật event id={}: {}", event.getId(), e.getMessage());
            }
        }

        log.info("✅ Hoàn tất cập nhật trạng thái event.");
    }
}