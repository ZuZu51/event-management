import { callApi } from "../common/helper/callApi";
import type {
  CreateEventInput,
  EventStats,
  EventType,
  UserEventDTO,
} from "../types/Event";

export const getEvents = async (): Promise<EventType[]> => {
  try {
    const events = await callApi<EventType[]>("GET", "events", undefined, true);
    
    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    throw error;
  }
};
export const createEvent = async (eventData: CreateEventInput) => {
  try {
    const response = await callApi("POST", "events", eventData, true);
    return response;
  } catch (error) {
    console.error("Failed to create event:", error);
    throw error;
  }
};

export const updateEventStatus = async (eventId: string, status: number) => {
  try {
    const response = await callApi(
      "PATCH",
      `events/${eventId}/status?status=${status}`,
      undefined,
      true
    );
    return response;
  } catch (error) {
    console.error("Failed to update event status:", error);
    throw error;
  }
};

export const getEventStats = async (eventId: number): Promise<EventStats> => {
  try {
    const response = await callApi<EventStats>(
      "GET",
      `events/stats/${eventId}`,
      undefined,
      true
    );
    return response;
  } catch (error) {
    console.error(`Failed to fetch stats for event ${eventId}:`, error);
    throw error;
  }
};

export const exportEventAttendees = async (eventId: number) => {
  try {
    const blob = await callApi<Blob>(
      "GET",
      `events/${eventId}/attendees/export`,
      undefined,
      true,
      { responseType: "blob" } // trả về blob thay vì JSON
    );

    // Tạo link download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendees_event_${eventId}.xlsx`; // tên file
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Failed to export attendees:", error);
    throw error;
  }
};

export const updateEventSchedule = async (
  customId: number,
  updateData: {
    // schedule
    date: string; // "YYYY-MM-DD"
    startTime: string; // "HH:mm:ss"
    location: string;
    // metadata (optional)
    name?: string;
    description?: string;
    durationMinutes?: number;
    ticketed?: boolean;
    ticketPrice?: number;
    category?: string;
    mode?: string;
    organizer?: string;
    joinLink?: string;
    qaLink?: string;
  }
) => {
  try {
    const response = await callApi(
      "PUT",
      `events/${customId}`,
      updateData,
      true
    );
    return response;
  } catch (error) {
    console.error(`Failed to update schedule for event ${customId}:`, error);
    throw error;
  }
};

/**
 * Cập nhật toàn bộ thông tin sự kiện (full update)
 */
export const updateEvent = async (customId: number, updateData: any) => {
  try {
   
    const response = await callApi(
      "PUT",
      `events/${customId}`,
      updateData,
      true
    );
    return response;
  } catch (error) {
    console.error(`Failed to update event ${customId}:`, error);
    throw error;
  }
};

export const cancelEvent = async (customId: string | number) => {
  try {
    const response = await callApi(
      "PUT",
      `events/cancel/${customId}`,
      undefined, // không cần body
      true
    );
    return response;
  } catch (error) {
    console.error(`Failed to cancel event with customId ${customId}:`, error);
    throw error;
  }
};

export const deleteEvent = async (eventId: number) => {
  try {
    const response = await callApi(
      "DELETE",
      `events/id/${eventId}`,
      undefined,
      true
    );
    return response;
  } catch (error) {
    console.error(`Failed to delete event with ID ${eventId}:`, error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái duyệt sự kiện
 * @param eventId ID sự kiện
 * @param approvalStatus Trạng thái duyệt (1: Chưa gửi, 2: Gửi duyệt, 3: Chấp thuận, 4: Từ chối, 0: Hủy)
 */
export const updateApprovalStatus = async (
  eventId: number,
  approvalStatus: number
) => {
  try {
    const response = await callApi(
      "PATCH",
      `events/${eventId}/approval-status`,
      { approvalStatus },
      true
    );
    return response;
  } catch (error) {
    console.error(
      `Failed to update approval status for event ${eventId}:`,
      error
    );
    throw error;
  }
};

export const getUserEvents = async (
  userId: number
): Promise<UserEventDTO[]> => {
  try {
    const events = await callApi<UserEventDTO[]>(
      "GET",
      `events/user/${userId}/events`,
      undefined,
      true
    );
    return events;
  } catch (error) {
    console.error(`Failed to fetch events for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Tạo link thanh toán VNPay cho vé sự kiện
 * @param ticketPrice Giá vé (VND)
 * @param idEvent ID sự kiện
 * @param idUser ID người dùng
 * @returns URL thanh toán VNPay
 */
export const createPayment = async (
  amount: number,
  trackingCode: string,
  userId: number
): Promise<string> => {
  try {
    // Tạo form data
    const formData = new URLSearchParams();
    formData.append("amount", amount.toString());
    formData.append("trackingCode", trackingCode);
    formData.append("userId", userId.toString());

    const res = await callApi<{
      code: string;
      message: string;
      data: string; // paymentUrl
    }>(
      "POST",
      `payment?${formData.toString()}`, // hoặc gửi body nếu callApi hỗ trợ form-urlencoded
      null,
      true
    );

    if (res.code === "00") {
      return res.data;
    } else {
      throw new Error("Tạo thanh toán thất bại: " + res.message);
    }
  } catch (error) {
    console.error("Failed to create payment:", error);
    throw error;
  }
};

/**
 * Xử lý callback VNPay sau khi thanh toán
 * @param params Query params từ URL callback VNPay
 * @returns Message trạng thái thanh toán
 */
export const handleVNPayReturn = async (
  params: Record<string, string>
): Promise<string> => {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`/payment/vnpay-return?${query}`);
    const text = await res.text();
    return text;
  } catch (error) {
    console.error("Failed to handle VNPay return:", error);
    throw error;
  }
};
