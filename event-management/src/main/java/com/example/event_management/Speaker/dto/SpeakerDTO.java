package com.example.event_management.Speaker.dto;

import com.example.event_management.Speaker.entity.Role;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpeakerDTO {
    private Long id;
    private String name;
    private String bio;
    private Role role;
}
