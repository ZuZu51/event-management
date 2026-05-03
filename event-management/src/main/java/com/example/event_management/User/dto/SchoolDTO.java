package com.example.event_management.User.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SchoolDTO {
    private Long id;
    private String name;
    private String code;
    private String city;
}
