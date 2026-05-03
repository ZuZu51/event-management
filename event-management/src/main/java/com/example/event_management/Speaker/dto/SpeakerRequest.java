package com.example.event_management.Speaker.dto;

import com.example.event_management.Speaker.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data // Tạo getter, setter, toString, equals, hashCode
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpeakerRequest {
    private Long id;         // ID speaker (dùng cho update)
    private String name;     // Tên diễn giả hoặc khách mời
    private String bio;      // Tiểu sử hoặc mô tả ngắn
    private Role role;
}
