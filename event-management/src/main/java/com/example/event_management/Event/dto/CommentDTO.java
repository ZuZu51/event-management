package com.example.event_management.Event.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommentDTO {
    private Long id;
    private Long eventId;
    private Long userId;
    private String userName;
    private String userAvatar;
    private String content;
    private Integer likeCount;
    private Boolean isLikedByCurrentUser;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime editedAt;
    private Boolean isEdited;
    private Long parentCommentId;
    private Integer replyCount;
}
