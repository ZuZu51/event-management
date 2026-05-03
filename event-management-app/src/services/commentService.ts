import { callApi } from "../common/helper/callApi";

export interface CommentDTO {
  id: number;
  eventId: number;
  userId: number;
  userName: string;
  userAvatar: string;
  content: string;
  likeCount: number;
  isLikedByCurrentUser: boolean;
  createdAt: string;
  updatedAt: string;
  editedAt?: string;
  isEdited: boolean;
  parentCommentId?: number;
  replyCount: number;
}

export interface CommentResponse {
  content: CommentDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  number: number;
}

class CommentService {
  // 1. Lấy comments gốc của event
  getCommentsByEventId(eventId: number, page: number = 0, size: number = 10) {
    return callApi<CommentResponse>(
      "GET",
      `events/${eventId}/comments?page=${page}&size=${size}`,
      undefined,
      true
    );
  }

  // 2. Lấy replies của comment
  getRepliesByCommentId(eventId: number, commentId: number, page: number = 0, size: number = 5) {
    return callApi<CommentResponse>(
      "GET",
      `events/${eventId}/comments/${commentId}/replies?page=${page}&size=${size}`,
      undefined,
      true
    );
  }

  // 3. Lấy chi tiết 1 comment
  getCommentById(eventId: number, commentId: number) {
    return callApi<CommentDTO>(
      "GET",
      `events/${eventId}/comments/${commentId}`,
      undefined,
      true
    );
  }

  // 4. Tạo comment gốc
  createComment(eventId: number, content: string) {
    return callApi<CommentDTO>(
      "POST",
      `events/${eventId}/comments`,
      { content },
      true
    );
  }

  // 5. Tạo reply cho comment
  createReply(eventId: number, commentId: number, content: string) {
    return callApi<CommentDTO>(
      "POST",
      `events/${eventId}/comments/${commentId}/replies`,
      { content },
      true
    );
  }

  // 6. Cập nhật comment
  updateComment(eventId: number, commentId: number, content: string) {
    return callApi<CommentDTO>(
      "PUT",
      `events/${eventId}/comments/${commentId}`,
      { content },
      true
    );
  }

  // 7. Xóa comment
  deleteComment(eventId: number, commentId: number) {
    return callApi<void>(
      "DELETE",
      `events/${eventId}/comments/${commentId}`,
      undefined,
      true
    );
  }

  // 8. Like comment
  likeComment(eventId: number, commentId: number) {
    return callApi<CommentDTO>(
      "POST",
      `events/${eventId}/comments/${commentId}/like`,
      undefined,
      true
    );
  }

  // 9. Unlike comment
  unlikeComment(eventId: number, commentId: number) {
    return callApi<CommentDTO>(
      "DELETE",
      `events/${eventId}/comments/${commentId}/like`,
      undefined,
      true
    );
  }
}

export default new CommentService();
