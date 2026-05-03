package com.example.event_management.Speaker.controller;

import com.example.event_management.Speaker.dto.SpeakerDTO;
import com.example.event_management.Speaker.dto.SpeakerRequest;
import com.example.event_management.Speaker.entity.Speaker;
import com.example.event_management.Speaker.entity.Role;
import com.example.event_management.Speaker.service.SpeakerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/speakers")
@RequiredArgsConstructor
public class SpeakerController {

    private final SpeakerService speakerService;

    // 🔹 Lấy danh sách tất cả speaker
    @GetMapping
    public ResponseEntity<List<Speaker>> getAllSpeakers() {
        return ResponseEntity.ok(speakerService.getAllSpeakers());
    }

    // 🔹 Lấy speaker theo ID
    @GetMapping("/{id}")
    public ResponseEntity<SpeakerDTO> getSpeakerById(@PathVariable Long id) {
        return speakerService.getSpeakerById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Tạo mới speaker
    @PostMapping
    public ResponseEntity<List<Speaker>> createSpeakers(@RequestBody List<SpeakerRequest> requests) {
        try {
            List<Speaker> createdSpeakers = speakerService.createSpeaker(requests);
            return ResponseEntity.ok(createdSpeakers);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(null);
        }
    }

    // 🔹 Tạo speaker cho event cụ thể
    @PostMapping("/event/{eventId}/speakers")
    public ResponseEntity<List<Speaker>> createSpeakersForEvent(
            @PathVariable Long eventId,
            @RequestBody List<SpeakerRequest> requests) {
        try {
            List<Speaker> createdSpeakers = speakerService.createSpeakerForEvent(eventId, requests);
            return ResponseEntity.ok(createdSpeakers);
        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(null);
        }
    }



    // 🔹 Cập nhật speaker
    @PutMapping("/{id}")
    public ResponseEntity<SpeakerDTO> updateSpeaker(
            @PathVariable Long id,
            @RequestBody SpeakerRequest request
    ) {
        Speaker updated = speakerService.updateSpeaker(id, Speaker.builder()
                .name(request.getName())
                .bio(request.getBio())
                .role(request.getRole())
                .build());
        SpeakerDTO dto = SpeakerDTO.builder()
                .id(updated.getId())
                .name(updated.getName())
                .bio(updated.getBio())
                .role(updated.getRole())
                .build();
        return ResponseEntity.ok(dto);
    }

    // 🔹 Cập nhật nhiều speaker cùng lúc
    @PutMapping("/batch-update")
    public ResponseEntity<List<SpeakerDTO>> updateSpeakersBatch(
            @RequestBody List<SpeakerRequest> requests
    ) {
        try {
            if (requests == null || requests.isEmpty()) {
                return ResponseEntity.badRequest().body(null);
            }
            
            List<SpeakerDTO> dtos = requests.stream()
                    .map(request -> {
                        if (request.getId() == null) {
                            throw new RuntimeException("Speaker ID is required for update");
                        }
                        Speaker updated = speakerService.updateSpeaker(
                                request.getId(),
                                Speaker.builder()
                                        .name(request.getName())
                                        .bio(request.getBio())
                                        .role(request.getRole())
                                        .build()
                        );
                        return SpeakerDTO.builder()
                                .id(updated.getId())
                                .name(updated.getName())
                                .bio(updated.getBio())
                                .role(updated.getRole())
                                .build();
                    })
                    .toList();
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(400).body(null);
        }
    }

    // 🔹 Xóa speaker theo ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSpeaker(@PathVariable Long id) {
        speakerService.deleteSpeaker(id);
        return ResponseEntity.noContent().build();
    }

    // 🔹 Lấy danh sách speaker theo Event ID
    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<SpeakerDTO>> getSpeakersByEventId(@PathVariable Long eventId) {
        List<Speaker> speakers = speakerService.getSpeakersByEventId(eventId);
        List<SpeakerDTO> dtos = speakers.stream()
                .map(s -> SpeakerDTO.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .bio(s.getBio())
                        .role(s.getRole())
                        .build())
                .toList();
        return ResponseEntity.ok(dtos);
    }

    // 🔹 Lấy danh sách speaker theo vai trò (SPEAKER / GUEST)
    @GetMapping("/role/{role}")
    public ResponseEntity<List<Speaker>> getSpeakersByRole(@PathVariable Role role) {
        return ResponseEntity.ok(speakerService.getSpeakersByRole(role));
    }

    // 🔹 Tìm kiếm speaker theo tên (không phân biệt hoa thường)
    @GetMapping("/search")
    public ResponseEntity<List<Speaker>> searchSpeakersByName(@RequestParam String name) {
        return ResponseEntity.ok(speakerService.searchSpeakersByName(name));
    }
}
