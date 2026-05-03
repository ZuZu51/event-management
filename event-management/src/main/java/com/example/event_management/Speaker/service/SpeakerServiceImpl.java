package com.example.event_management.Speaker.service;

import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.Speaker.dto.SpeakerDTO;
import com.example.event_management.Speaker.dto.SpeakerRequest;
import com.example.event_management.Speaker.entity.Speaker;
import com.example.event_management.Speaker.entity.Role;
import com.example.event_management.Speaker.repository.SpeakerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SpeakerServiceImpl implements SpeakerService {

    private final SpeakerRepository speakerRepository;
    private final EventRepository eventRepository;

    @Override
    public List<Speaker> getAllSpeakers() {
        return speakerRepository.findAll();
    }

    @Override
    public Optional<SpeakerDTO> getSpeakerById(Long id) {
        return speakerRepository.findById(id)
                .map(s -> SpeakerDTO.builder()
                        .name(s.getName())
                        .bio(s.getBio())
                        .role(s.getRole())
                        .build());
    }

    @Override
    public List<Speaker> createSpeaker(List<SpeakerRequest> requests) {
        // Lấy event mới nhất
        Event event = eventRepository.findTopByOrderByIdDesc()
                .orElseThrow(() -> new RuntimeException("No events found in database"));

        List<Speaker> createdSpeakers = new ArrayList<>();
        for (SpeakerRequest request : requests) {
            Speaker speaker = Speaker.builder()
                    .name(request.getName())
                    .bio(request.getBio())
                    .role(request.getRole())
                    .event(event)
                    .build();
            createdSpeakers.add(speakerRepository.save(speaker));
        }

        return createdSpeakers;
    }

    @Override
    public List<Speaker> createSpeakerForEvent(Long eventId, List<SpeakerRequest> requests) {
        // Lấy event từ eventId
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + eventId));

        List<Speaker> createdSpeakers = new ArrayList<>();
        for (SpeakerRequest request : requests) {
            Speaker speaker = Speaker.builder()
                    .name(request.getName())
                    .bio(request.getBio())
                    .role(request.getRole())
                    .event(event)
                    .build();
            createdSpeakers.add(speakerRepository.save(speaker));
        }

        return createdSpeakers;
    }

    @Override
    public Speaker updateSpeaker(Long id, Speaker updatedSpeaker) {
        return speakerRepository.findById(id)
                .map(speaker -> {
                    speaker.setName(updatedSpeaker.getName());
                    speaker.setBio(updatedSpeaker.getBio());
                    speaker.setRole(updatedSpeaker.getRole());
                    // Chỉ update event nếu có giá trị, giữ event cũ nếu null
                    if (updatedSpeaker.getEvent() != null) {
                        speaker.setEvent(updatedSpeaker.getEvent());
                    }
                    return speakerRepository.save(speaker);
                })
                .orElseThrow(() -> new RuntimeException("Speaker not found with id: " + id));
    }

    @Override
    public void deleteSpeaker(Long id) {
        if (!speakerRepository.existsById(id)) {
            throw new RuntimeException("Speaker not found with id: " + id);
        }
        speakerRepository.deleteById(id);
    }

    @Override
    public List<Speaker> getSpeakersByEventId(Long eventId) {
        return speakerRepository.findByEventId(eventId);
    }

    @Override
    public List<Speaker> getSpeakersByRole(Role role) {
        return speakerRepository.findByRole(role);
    }

    @Override
    public List<Speaker> searchSpeakersByName(String name) {
        return speakerRepository.findByNameContainingIgnoreCase(name);
    }
}
