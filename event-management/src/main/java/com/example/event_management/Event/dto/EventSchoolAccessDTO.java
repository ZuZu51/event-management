package com.example.event_management.Event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.event_management.Event.entity.EventSchoolAccess;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSchoolAccessDTO {
    private Long id;
    private Long schoolId;
    private String schoolName;

    public static EventSchoolAccessDTO from(EventSchoolAccess entity) {
        return EventSchoolAccessDTO.builder()
                .id(entity.getId())
                .schoolId(entity.getSchool().getId())
                .schoolName(entity.getSchool().getName())
                .build();
    }
}
