import { callApi } from "../common/helper/callApi";
import type { CreateTicketInput, TicketUpdateDTO } from "../types/Ticket";

/**
 * Gửi ticket lên backend
 * @param ticketData object { userId, eventId }
 */
export const createTicket = async (ticketData: CreateTicketInput) => {
  try {
    const response = await callApi(
      "POST",
      "tickets", // endpoint
      ticketData, // gửi object JSON
      true // có token nếu cần
    );
    return response;
  } catch (error) {
    console.error("Failed to create ticket:", error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái ticket
 * @param ticketCode mã ticket
 * @param eventId id sự kiện
 * @returns TicketDTO
 */
export const updateTicketStatus = async (
  ticketCode: string,
  eventId: number
) => {
  try {
    const response = await callApi(
      "POST",
      `tickets/update-status/${ticketCode}/${eventId}`, // endpoint
      null, // backend không cần body
      true // có token nếu cần
    );

    return response as TicketUpdateDTO;
  } catch (error) {
    console.error("Failed to update ticket status:", error);
    throw error;
  }
};

/**
 * Lấy tất cả ticket của một user (frontend wrapper).
 * @param userId id user
 */
export const getTicketsByUser = async (userId: number) => {
  try {
    const response = await callApi("GET", `tickets/user/${userId}`, null, true);
    return response;
  } catch (error) {
    // Log error and return empty array so callers can handle 'no tickets' gracefully
    console.error("Failed to get tickets by user:", error);
    return [] as { event?: { id?: number } }[];
  }
};

/**
 * Lấy danh sách điểm danh từ tickets (cho QR scanning)
 * @param eventId id sự kiện
 */
export const getEventAttendanceFromTickets = async (eventId: number) => {
  try {
    const response = await callApi(
      "GET",
      `tickets/attendance/${eventId}`,
      null,
      true
    );
    return response;
  } catch (error) {
    console.error("Failed to get attendance from tickets:", error);
    throw error;
  }
};

/**
 * Lấy danh sách ticket của một sự kiện
 * @param eventId id sự kiện
 */
export const getTicketsByEvent = async (eventId: number) => {
  try {
    const response = await callApi(
      "GET",
      `tickets/event/${eventId}`,
      null,
      true
    );
    console.log("xxx...",response)
    return response;
  } catch (error) {
    console.error("Failed to get tickets by event:", error);
    return [];
  }
};

/**
 * Lấy chi tiết ticket theo ID
 * @param ticketId id của ticket
 */
export const getTicketById = async (ticketId: number) => {
  try {
    const response = await callApi(
      "GET",
      `tickets/${ticketId}`,
      null,
      true
    );
    return response;
  } catch (error) {
    console.error("Failed to get ticket by id:", error);
    return null;
  }
};

/**
 * Lấy chi tiết ticket theo mã ticket (QR code)
 * @param ticketCode mã ticket
 */
export const getTicketByCode = async (ticketCode: string) => {
  try {
    const response = await callApi(
      "GET",
      `tickets/code/${ticketCode}`,
      null,
      true
    );
    return response;
  } catch (error) {
    console.error("Failed to get ticket by code:", error);
    return null;
  }
};
