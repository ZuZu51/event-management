package com.example.event_management.Event.repository;

import com.example.event_management.Event.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {

    // Lấy comments gốc của event (không có parent)
    Page<Comment> findByEventIdAndParentCommentIdNullAndIsDeletedFalse(
            Long eventId,
            Pageable pageable
    );

    // Lấy replies của 1 comment
    Page<Comment> findByParentCommentIdAndIsDeletedFalse(
            Long parentCommentId,
            Pageable pageable
    );

    // Lấy comment theo ID nếu không bị delete
    @Query("SELECT c FROM Comment c WHERE c.id = :id AND c.isDeleted = false")
    Optional<Comment> findByIdAndNotDeleted(@Param("id") Long id);

    // Đếm comments gốc của event
    Long countByEventIdAndParentCommentIdNullAndIsDeletedFalse(Long eventId);

    // Đếm replies của comment
    Long countByParentCommentIdAndIsDeletedFalse(Long parentCommentId);

    // Lấy comments của user
    Page<Comment> findByUserIdAndIsDeletedFalse(Long userId, Pageable pageable);

    // Lấy tất cả comments của event (bao gồm replies) 
    @Query("SELECT c FROM Comment c WHERE c.event.id = :eventId AND c.isDeleted = false ORDER BY c.createdAt DESC")
    List<Comment> findAllByEventId(@Param("eventId") Long eventId);

    // Kiểm tra comment tồn tại
    boolean existsByIdAndIsDeletedFalse(Long id);
}
