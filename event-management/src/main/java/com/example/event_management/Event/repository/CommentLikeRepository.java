package com.example.event_management.Event.repository;

import com.example.event_management.Event.entity.CommentLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, Long> {

    // Kiểm tra user đã like comment chưa
    Optional<CommentLike> findByCommentIdAndUserId(Long commentId, Long userId);

    // Xóa like
    void deleteByCommentIdAndUserId(Long commentId, Long userId);

    // Đếm lượt like của comment
    Long countByCommentId(Long commentId);

    // Kiểm tra like tồn tại
    boolean existsByCommentIdAndUserId(Long commentId, Long userId);
}
