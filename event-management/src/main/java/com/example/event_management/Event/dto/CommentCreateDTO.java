package com.example.event_management.Event.dto;

import lombok.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentCreateDTO {

    @NotBlank(message = "Nội dung comment không được để trống")
    @Size(min = 1, max = 2000, message = "Nội dung phải từ 1 đến 2000 ký tự")
    private String content;
}
