import React, { useState, useEffect } from "react";
import commentService from "../services/commentService";
import type { CommentDTO } from "../services/commentService";
import "../styles/commentSection.css";

interface CommentSectionProps {
  eventId: number;
  eventData?: { createdById?: number };
}

const CommentSection: React.FC<CommentSectionProps> = ({ eventId, eventData }) => {
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [repliesData, setRepliesData] = useState<Map<number, CommentDTO[]>>(new Map());

  const isLoggedIn = !!localStorage.getItem("token");
  const currentUserId = JSON.parse(localStorage.getItem("idUser"));
 
  const userRole = JSON.parse(localStorage.getItem("role"));
  
  const canEditOrDelete = (commentUserId: number) => {
    
    if (!isLoggedIn) return false;
    
    const isOwner = currentUserId === String(commentUserId);
    
    const isAdmin = userRole?.includes("ADMIN") || false;
   
    return isOwner || isAdmin;
  };
  
  // Load comments khi component mount hoặc page thay đổi
  
  useEffect(() => {
    loadComments();
  }, [eventId, page]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await commentService.getCommentsByEventId(eventId, page);
      setComments(response.content || []);
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error("Lỗi khi tải comments:", error);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComment = async () => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để bình luận");
      return;
    }

    if (!newComment.trim()) {
      alert("Vui lòng nhập nội dung comment");
      return;
    }

    try {
      const created = await commentService.createComment(eventId, newComment);
      setComments([created, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error("Lỗi khi tạo comment:", error);
      alert("Không thể tạo comment");
    }
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editingContent.trim()) {
      alert("Vui lòng nhập nội dung");
      return;
    }

    try {
      const updated = await commentService.updateComment(
        eventId,
        commentId,
        editingContent
      );
      setComments(comments.map((c) => (c.id === commentId ? updated : c)));
      setEditingId(null);
      setEditingContent("");
    } catch (error) {
      console.error("Lỗi khi cập nhật comment:", error);
      alert("Không thể cập nhật comment");
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa comment này?")) return;

    try {
      await commentService.deleteComment(eventId, commentId);
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error("Lỗi khi xóa comment:", error);
      alert("Không thể xóa comment");
    }
  };

  const handleLike = async (commentId: number, isLiked: boolean) => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để like");
      return;
    }

    try {
      const updated = isLiked
        ? await commentService.unlikeComment(eventId, commentId)
        : await commentService.likeComment(eventId, commentId);
      setComments(comments.map((c) => (c.id === commentId ? updated : c)));
    } catch (error) {
      console.error("Lỗi khi like comment:", error);
    }
  };

  const toggleReplies = async (commentId: number) => {
    if (expandedReplies.has(commentId)) {
      expandedReplies.delete(commentId);
      setExpandedReplies(new Set(expandedReplies));
    } else {
      try {
        const response = await commentService.getRepliesByCommentId(
          eventId,
          commentId
        );
        const newRepliesData = new Map(repliesData);
        newRepliesData.set(commentId, response.content || []);
        setRepliesData(newRepliesData);
        expandedReplies.add(commentId);
        setExpandedReplies(new Set(expandedReplies));
      } catch (error) {
        console.error("Lỗi khi tải replies:", error);
      }
    }
  };

  const handleAddReply = async (parentCommentId: number, content: string) => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để reply");
      return;
    }

    if (!content.trim()) {
      alert("Vui lòng nhập nội dung reply");
      return;
    }

    try {
      const reply = await commentService.createReply(
        eventId,
        parentCommentId,
        content
      );
      const newRepliesData = new Map(repliesData);
      const replies = newRepliesData.get(parentCommentId) || [];
      newRepliesData.set(parentCommentId, [reply, ...replies]);
      setRepliesData(newRepliesData);
    } catch (error) {
      console.error("Lỗi khi tạo reply:", error);
      alert("Không thể tạo reply");
    }
  };

  return (
    <div className="comment-section">
      <h3>Bình luận ({comments.length})</h3>

      {/* Form thêm comment */}
      {isLoggedIn && (
        <div className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết bình luận của bạn..."
            className="comment-input"
            rows={3}
          />
          <button onClick={handleCreateComment} className="btn-submit">
            Gửi bình luận
          </button>
        </div>
      )}

      {/* Danh sách comments */}
      <div className="comments-list">
        {loading ? (
          <p>Đang tải...</p>
        ) : comments.length === 0 ? (
          <p className="no-comments">Chưa có bình luận nào</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <img
                  src={comment.userAvatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"}
                  alt={comment.userName}
                  className="avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                  }}
                />
                <div className="user-info">
                  <h5>
                    {comment.userName}
                    {eventData?.createdById && Number(comment.userId) === Number(eventData.createdById) && (
                      <span style={{ color: '#f59e0b', marginLeft: '0.5rem', fontSize: '0.9em', fontWeight: 'bold' }}>
                        (Owner)
                      </span>
                    )}
                  </h5>
                  <span className="timestamp">
                    {new Date(comment.createdAt).toLocaleDateString("vi-VN")}
                    {comment.isEdited && " (đã chỉnh sửa)"}
                  </span>
                </div>
              </div>

              {editingId === comment.id ? (
                <div className="comment-edit">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                  />
                  <div className="edit-buttons">
                    <button
                      onClick={() => handleUpdateComment(comment.id)}
                      className="btn-save"
                    >
                      Lưu
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn-cancel"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="comment-content">{comment.content}</p>
                  <div className="comment-actions">
                    <button
                      onClick={() =>
                        handleLike(comment.id, comment.isLikedByCurrentUser)
                      }
                      className={`btn-action-sm ${
                        comment.isLikedByCurrentUser ? "liked" : ""
                      }`}
                    >
                      👍 {comment.likeCount}
                    </button>

                     
                      <button
                        onClick={() => toggleReplies(comment.id)}
                        className="btn-action-sm"
                      >
                        💬 {comment.replyCount} trả lời
                      </button>
                    

                    {canEditOrDelete(comment.userId) && (
                      <button
                        onClick={() => {
                          setEditingId(comment.id);
                          setEditingContent(comment.content);
                        }}
                        className="btn-action-sm"
                      >
                        Sửa
                      </button>
                    )}

                    {canEditOrDelete(comment.userId) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="btn-action-sm btn-delete"
                      >
                        Xóa
                      </button>
                    )}
                  </div>

                  {/* Replies section */}
                  {expandedReplies.has(comment.id) && (
                    <div className="replies-section">
                      <ReplyForm
                        onAddReply={(content) =>
                          handleAddReply(comment.id, content)
                        }
                      />
                      <div className="replies-list">
                        {(repliesData.get(comment.id) || []).map((reply) => (
                          <div key={reply.id} className="reply-item">
                            <div className="comment-header">
                              <img
                                src={
                                  reply.userAvatar || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"
                                }
                                alt={reply.userName}
                                className="avatar avatar-sm"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";
                                }}
                              />
                              <div className="user-info">
                                <h6>
                                  {reply.userName}
                                  {eventData?.createdById && Number(reply.userId) === Number(eventData.createdById) && (
                                    <span style={{ color: '#f59e0b', marginLeft: '0.5rem', fontSize: '0.85em', fontWeight: 'bold' }}>
                                      (Owner)
                                    </span>
                                  )}
                                </h6>
                                <span className="timestamp-sm">
                                  {new Date(reply.createdAt).toLocaleDateString(
                                    "vi-VN"
                                  )}
                                </span>
                              </div>
                            </div>
                            <p className="reply-content">{reply.content}</p>
                            <div className="comment-actions">
                              <button
                                onClick={() =>
                                  handleLike(
                                    reply.id,
                                    reply.isLikedByCurrentUser
                                  )
                                }
                                className={`btn-action-sm ${
                                  reply.isLikedByCurrentUser ? "liked" : ""
                                }`}
                              >
                                👍 {reply.likeCount}
                              </button>

                              {canEditOrDelete(reply.userId) && (
                                <button
                                  onClick={() => {
                                    setEditingId(reply.id);
                                    setEditingContent(reply.content);
                                  }}
                                  className="btn-action-sm"
                                >
                                  Sửa
                                </button>
                              )}

                              {canEditOrDelete(reply.userId) && (
                                <button
                                  onClick={() => handleDeleteComment(reply.id)}
                                  className="btn-action-sm btn-delete"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
          >
            ← Trước
          </button>
          <span>
            Trang {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
          >
            Tiếp →
          </button>
        </div>
      )}
    </div>
  );
};

// Component ReplyForm
interface ReplyFormProps {
  onAddReply: (content: string) => void;
}

const ReplyForm: React.FC<ReplyFormProps> = ({ onAddReply }) => {
  const [replyContent, setReplyContent] = useState("");

  const handleSubmit = () => {
    if (replyContent.trim()) {
      onAddReply(replyContent);
      setReplyContent("");
    }
  };

  return (
    <div className="reply-form">
      <input
        type="text"
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Viết trả lời..."
        className="reply-input"
        onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
      />
      <button onClick={handleSubmit} className="btn-reply">
        Gửi
      </button>
    </div>
  );
};

export default CommentSection;
