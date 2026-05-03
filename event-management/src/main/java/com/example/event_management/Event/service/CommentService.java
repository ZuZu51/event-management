package com.example.event_management.Event.service;

import com.example.event_management.Event.dto.CommentCreateDTO;
import com.example.event_management.Event.dto.CommentDTO;
import com.example.event_management.Event.entity.Comment;
import com.example.event_management.Event.entity.CommentLike;
import com.example.event_management.Event.entity.Event;
import com.example.event_management.Event.repository.CommentRepository;
import com.example.event_management.Event.repository.CommentLikeRepository;
import com.example.event_management.Event.repository.EventRepository;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.NoSuchElementException;

@Service
public class CommentService {

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private CommentLikeRepository commentLikeRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Lấy comments gốc của event (phân trang)
     */
    public Page<CommentDTO> getCommentsByEventId(Long eventId, Pageable pageable, Long currentUserId) {
        // Kiểm tra event tồn tại
        if (!eventRepository.existsById(eventId)) {
            throw new NoSuchElementException("Event không tồn tại");
        }

        Page<Comment> comments = commentRepository.findByEventIdAndParentCommentIdNullAndIsDeletedFalse(eventId, pageable);
        return comments.map(comment -> mapToDTO(comment, currentUserId));
    }

    /**
     * Lấy replies của 1 comment (phân trang)
     */
    public Page<CommentDTO> getRepliesByCommentId(Long commentId, Pageable pageable, Long currentUserId) {
        // Kiểm tra comment gốc tồn tại
        Comment parentComment = commentRepository.findByIdAndNotDeleted(commentId)
            .orElseThrow(() -> new NoSuchElementException("Comment không tồn tại"));

        // Parent comment không được là reply
        if (parentComment.getParentComment() != null) {
            throw new IllegalArgumentException("Không thể lấy reply của một reply");
        }

        Page<Comment> replies = commentRepository.findByParentCommentIdAndIsDeletedFalse(commentId, pageable);
        return replies.map(comment -> mapToDTO(comment, currentUserId));
    }

    /**
     * Lấy chi tiết 1 comment
     */
    public CommentDTO getCommentById(Long commentId, Long currentUserId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
            .orElseThrow(() -> new NoSuchElementException("Comment không tồn tại"));
        return mapToDTO(comment, currentUserId);
    }

    /**
     * Tạo comment gốc cho event
     */
    @Transactional
    public CommentDTO createComment(Long eventId, Long userId, CommentCreateDTO dto) {
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new NoSuchElementException("Event không tồn tại"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NoSuchElementException("User không tồn tại"));

        Comment comment = Comment.builder()
            .event(event)
            .user(user)
            .content(dto.getContent())
            .parentComment(null)
            .likeCount(0)
            .isDeleted(false)
            .build();

        comment = commentRepository.save(comment);
        return mapToDTO(comment, userId);
    }

    /**
     * Tạo reply cho comment
     */
    @Transactional
    public CommentDTO createReply(Long eventId, Long parentCommentId, Long userId, CommentCreateDTO dto) {
        // Kiểm tra event
        Event event = eventRepository.findById(eventId)
            .orElseThrow(() -> new NoSuchElementException("Event không tồn tại"));

        // Kiểm tra parent comment tồn tại
        Comment parentComment = commentRepository.findByIdAndNotDeleted(parentCommentId)
            .orElseThrow(() -> new NoSuchElementException("Comment gốc không tồn tại"));

        // Parent comment phải thuộc event này
        if (!parentComment.getEvent().getId().equals(eventId)) {
            throw new IllegalArgumentException("Comment không thuộc sự kiện này");
        }

        // Parent comment không được là reply
        if (parentComment.getParentComment() != null) {
            throw new IllegalArgumentException("Không thể reply cho một reply");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NoSuchElementException("User không tồn tại"));

        Comment reply = Comment.builder()
            .event(event)
            .user(user)
            .parentComment(parentComment)
            .content(dto.getContent())
            .likeCount(0)
            .isDeleted(false)
            .build();

        reply = commentRepository.save(reply);
        return mapToDTO(reply, userId);
    }

    /**
     * Cập nhật comment
     */
    @Transactional
    public CommentDTO updateComment(Long commentId, Long userId, CommentCreateDTO dto) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
            .orElseThrow(() -> new NoSuchElementException("Comment không tồn tại"));

        // Kiểm tra quyền: chỉ tác giả mới được sửa
        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền chỉnh sửa comment này");
        }

        comment.setContent(dto.getContent());
        comment.setEditedAt(LocalDateTime.now());
        comment = commentRepository.save(comment);
        return mapToDTO(comment, userId);
    }

    /**
     * Xóa comment (soft delete)
     */
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
            .orElseThrow(() -> new NoSuchElementException("Comment không tồn tại"));

        // Kiểm tra quyền
//        if (!comment.getUser().getId().equals(userId)) {
//            throw new IllegalArgumentException("Bạn không có quyền xóa comment này");
//        }

        comment.setIsDeleted(true);
        comment.setUpdatedAt(LocalDateTime.now());
        commentRepository.save(comment);
    }

    /**
     * Khôi phục comment bị xóa
     */
    @Transactional
    public CommentDTO restoreComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
            .orElseThrow(() -> new NoSuchElementException("Comment không tồn tại"));

        // Kiểm tra quyền
        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không có quyền khôi phục comment này");
        }

        comment.setIsDeleted(false);
        comment.setUpdatedAt(LocalDateTime.now());
        comment = commentRepository.save(comment);
        return mapToDTO(comment, userId);
    }

    /**
     * Like comment
     */
    @Transactional
    public CommentDTO likeComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
            .orElseThrow(() -> new NoSuchElementException("Comment không tồn tại"));

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NoSuchElementException("User không tồn tại"));

        // Kiểm tra user đã like chưa
        if (commentLikeRepository.existsByCommentIdAndUserId(commentId, userId)) {
            throw new IllegalArgumentException("Bạn đã like comment này rồi");
        }

        // Tạo like
        CommentLike like = CommentLike.builder()
            .comment(comment)
            .user(user)
            .build();

        commentLikeRepository.save(like);

        // Cập nhật like_count
        comment.setLikeCount(comment.getLikeCount() + 1);
        comment = commentRepository.save(comment);

        return mapToDTO(comment, userId);
    }

    /**
     * Unlike comment
     */
    @Transactional
    public CommentDTO unlikeComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findByIdAndNotDeleted(commentId)
            .orElseThrow(() -> new NoSuchElementException("Comment không tồn tại"));

        // Kiểm tra user đã like chưa
        if (!commentLikeRepository.existsByCommentIdAndUserId(commentId, userId)) {
            throw new IllegalArgumentException("Bạn chưa like comment này");
        }

        // Xóa like
        commentLikeRepository.deleteByCommentIdAndUserId(commentId, userId);

        // Cập nhật like_count
        if (comment.getLikeCount() > 0) {
            comment.setLikeCount(comment.getLikeCount() - 1);
        }
        comment = commentRepository.save(comment);

        return mapToDTO(comment, userId);
    }

    /**
     * Map Comment entity to CommentDTO
     */
    private CommentDTO mapToDTO(Comment comment, Long currentUserId) {
        // Đếm replies
        Long replyCount = commentRepository.countByParentCommentIdAndIsDeletedFalse(comment.getId());

        // Kiểm tra current user có like không
        Boolean isLikedByCurrentUser = currentUserId != null &&
            commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), currentUserId);

        return CommentDTO.builder()
            .id(comment.getId())
            .eventId(comment.getEvent().getId())
            .userId(comment.getUser().getId())
            .userName(comment.getUser().getName())
            .userAvatar(comment.getUser().getAvatar())
            .content(comment.getContent())
            .likeCount(comment.getLikeCount())
            .isLikedByCurrentUser(isLikedByCurrentUser)
            .createdAt(comment.getCreatedAt())
            .updatedAt(comment.getUpdatedAt())
            .editedAt(comment.getEditedAt())
            .isEdited(comment.getEditedAt() != null)
            .parentCommentId(comment.getParentComment() != null ? comment.getParentComment().getId() : null)
            .replyCount(replyCount.intValue())
            .build();
    }
}
