package com.example.event_management.Event.controller;

import com.example.event_management.Event.dto.CommentCreateDTO;
import com.example.event_management.Event.dto.CommentDTO;
import com.example.event_management.Event.service.CommentService;
import com.example.event_management.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.NoSuchElementException;

@RestController
@RequestMapping("/events/{eventId}/comments")
@CrossOrigin(origins = "*")
public class CommentController {

    @Autowired
    private CommentService commentService;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    /**
     * GET /events/{eventId}/comments
     * Lấy comments gốc của event (phân trang)
     */
    @GetMapping
    public ResponseEntity<Page<CommentDTO>> getComments(
            @PathVariable Long eventId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Long currentUserId = extractUserIdFromToken(request);
            Page<CommentDTO> comments = commentService.getCommentsByEventId(eventId, pageable, currentUserId);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /events/{eventId}/comments
     * Tạo comment gốc
     */
    @PostMapping
    public ResponseEntity<CommentDTO> createComment(
            @PathVariable Long eventId,
            @Valid @RequestBody CommentCreateDTO dto,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
            }

            CommentDTO createdComment = commentService.createComment(eventId, userId, dto);
            return new ResponseEntity<>(createdComment, HttpStatus.CREATED);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /events/{eventId}/comments/{commentId}
     * Lấy chi tiết 1 comment
     */
    @GetMapping("/{commentId}")
    public ResponseEntity<CommentDTO> getComment(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            HttpServletRequest request
    ) {
        try {
            Long currentUserId = extractUserIdFromToken(request);
            CommentDTO comment = commentService.getCommentById(commentId, currentUserId);
            return ResponseEntity.ok(comment);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * PUT /events/{eventId}/comments/{commentId}
     * Cập nhật comment
     */
    @PutMapping("/{commentId}")
    public ResponseEntity<CommentDTO> updateComment(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentCreateDTO dto,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
            }

            CommentDTO updatedComment = commentService.updateComment(commentId, userId, dto);
            return ResponseEntity.ok(updatedComment);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * DELETE /events/{eventId}/comments/{commentId}
     * Xóa comment (soft delete)
     */
    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
            }

            commentService.deleteComment(commentId, userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.FORBIDDEN);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * GET /events/{eventId}/comments/{commentId}/replies
     * Lấy danh sách replies của comment
     */
    @GetMapping("/{commentId}/replies")
    public ResponseEntity<Page<CommentDTO>> getReplies(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            HttpServletRequest request
    ) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Long currentUserId = extractUserIdFromToken(request);
            Page<CommentDTO> replies = commentService.getRepliesByCommentId(commentId, pageable, currentUserId);
            return ResponseEntity.ok(replies);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /events/{eventId}/comments/{commentId}/replies
     * Tạo reply cho comment
     */
    @PostMapping("/{commentId}/replies")
    public ResponseEntity<CommentDTO> createReply(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            @Valid @RequestBody CommentCreateDTO dto,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
            }

            CommentDTO createdReply = commentService.createReply(eventId, commentId, userId, dto);
            return new ResponseEntity<>(createdReply, HttpStatus.CREATED);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * POST /events/{eventId}/comments/{commentId}/like
     * Like comment
     */
    @PostMapping("/{commentId}/like")
    public ResponseEntity<CommentDTO> likeComment(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
            }

            CommentDTO comment = commentService.likeComment(commentId, userId);
            return ResponseEntity.ok(comment);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * DELETE /events/{eventId}/comments/{commentId}/like
     * Unlike comment
     */
    @DeleteMapping("/{commentId}/like")
    public ResponseEntity<CommentDTO> unlikeComment(
            @PathVariable Long eventId,
            @PathVariable Long commentId,
            HttpServletRequest request
    ) {
        try {
            Long userId = extractUserIdFromToken(request);
            if (userId == null) {
                return new ResponseEntity<>(HttpStatus.UNAUTHORIZED);
            }

            CommentDTO comment = commentService.unlikeComment(commentId, userId);
            return ResponseEntity.ok(comment);
        } catch (IllegalArgumentException e) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        } catch (NoSuchElementException e) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        } catch (Exception e) {
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Helper method: Extract userId from JWT token
     */
    private Long extractUserIdFromToken(HttpServletRequest request) {
        try {
            String auth = request.getHeader("Authorization");
            if (auth != null && auth.startsWith("Bearer ")) {
                String token = auth.substring(7);
                return jwtTokenProvider.getUserIdFromToken(token);
            }
        } catch (Exception e) {
            System.err.println("❌ Error extracting user ID from token: " + e.getMessage());
        }
        return null;
    }
}
