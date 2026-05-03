import { callApi } from "../common/helper/callApi";

/**
 * Hủy vé tham gia sự kiện (với kiểm tra điều kiện 2 ngày)
 * @param userId ID của user
 * @param eventId ID của event
 * @returns Success message hoặc lỗi
 */
export const cancelTicketRegistration = async (userId: number, eventId: number): Promise<unknown> => {
  try {
    const response = await callApi(
      "DELETE",
      `tickets/${userId}/${eventId}`,
      undefined,
      true // có token
    );
    return response;
  } catch (error) {
    console.error("Failed to cancel ticket:", error);
    throw error;
  }
};
