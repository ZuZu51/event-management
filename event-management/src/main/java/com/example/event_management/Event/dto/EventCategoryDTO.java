package com.example.event_management.Event.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventCategoryDTO {
    private Long id;
    private String label;
    private String value;
    private Boolean active;
}
