package com.example.event_management.security.service;

import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component("eventSecurity")
@RequiredArgsConstructor
public class EventSecurity {

    private final EventRepository eventRepository;
    private final UserRepository userRepository;

    /**
     * Check if the authenticated principal is the owner (creator) of the event.
     */
    public boolean isOwner(Authentication authentication, Long eventId) {
        if (authentication == null || authentication.getName() == null) return false;

        String username = authentication.getName(); // in this app username = email
        Optional<User> userOpt = userRepository.findByEmail(username);
        if (userOpt.isEmpty()) return false;
        Long userId = userOpt.get().getId();

        Optional<Event> eventOpt = eventRepository.findById(eventId);
        return eventOpt.map(e -> e.getCreatedById() != null && e.getCreatedById().equals(userId)).orElse(false);
    }
}
