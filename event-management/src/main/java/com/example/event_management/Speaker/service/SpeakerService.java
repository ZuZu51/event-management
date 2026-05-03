package com.example.event_management.Speaker.service;

import com.example.event_management.Speaker.dto.SpeakerDTO;
import com.example.event_management.Speaker.dto.SpeakerRequest;
import com.example.event_management.Speaker.entity.Speaker;
import com.example.event_management.Speaker.entity.Role;

import java.util.List;
import java.util.Optional;

public interface SpeakerService {

    // Lấy tất cả speaker
    List<Speaker> getAllSpeakers();

    // Lấy speaker theo ID
    Optional<SpeakerDTO> getSpeakerById(Long id);

    // Tạo mới speaker
    List<Speaker> createSpeaker(List<SpeakerRequest> request);

    // Tạo speaker cho event cụ thể
    List<Speaker> createSpeakerForEvent(Long eventId, List<SpeakerRequest> request);

    // Cập nhật speaker
    Speaker updateSpeaker(Long id, Speaker speaker);

    // Xóa speaker theo ID
    void deleteSpeaker(Long id);

    // Tìm theo event ID
    List<Speaker> getSpeakersByEventId(Long eventId);

    // Tìm theo role
    List<Speaker> getSpeakersByRole(Role role);

    // Tìm theo tên
    List<Speaker> searchSpeakersByName(String name);
}
