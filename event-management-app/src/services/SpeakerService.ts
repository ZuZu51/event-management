import { callApi } from "../common/helper/callApi";
import type { CreateSpeakerInput, Speaker } from "../types/Speaker";

/**
 * Gửi nhiều speaker lên backend cùng lúc
 * @param speakersData Mảng speaker
 * @param eventId ID của event (optional)
 */
export const createSpeakers = async (speakersData: CreateSpeakerInput[], eventId?: number) => {
  try {
    let url = "speakers";
    if (eventId) {
      url = `events/${eventId}/speakers`;
    }
    const response = await callApi(
      "POST",
      url,
      speakersData,
      true // có token nếu cần
    );
    return response;
  } catch (error) {
    console.error("Failed to create speakers:", error);
    throw error;
  }
};

/**
 * Lấy thông tin chi tiết của 1 speaker theo id
 */
export const getSpeakerById = async (id: number): Promise<Speaker> => {
  try {
    const speaker = await callApi<Speaker>(
      "GET",
      `speakers/${id}`,
      undefined,
      true
    );
    
    return speaker;
  } catch (error) {
    console.error(`Failed to fetch speaker with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Lấy danh sách tất cả speaker của event theo event ID
 * @param eventId Event ID
 */
export const getSpeakersByEventId = async (eventId: number): Promise<Speaker[]> => {
  try {
    const speakers = await callApi<Speaker[]>(
      "GET",
      `speakers/event/${eventId}`,
      undefined,
      true
    );
    return speakers;
  } catch (error) {
    console.error(`Failed to fetch speakers for event ${eventId}:`, error);
    return [];
  }
};

/**
 * Xóa speaker theo ID
 * @param id Speaker ID to delete
 */
export const deleteSpeaker = async (id: number): Promise<void> => {
  try {
    await callApi(
      "DELETE",
      `speakers/${id}`,
      undefined,
      true
    );
  } catch (error) {
    console.error(`Failed to delete speaker with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Cập nhật speaker theo ID
 * @param id Speaker ID
 * @param data Dữ liệu cập nhật (name, bio, role)
 */
export const updateSpeaker = async (id: number, data: CreateSpeakerInput): Promise<void> => {
  try {
    console.log("Updating speaker with data:", data);
    await callApi(
      "PUT",
      `speakers/${id}`,
      data,
      true
    );
  } catch (error) {
    console.error(`Failed to update speaker with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Cập nhật nhiều speaker cùng lúc
 * @param data Mảng speaker có id + name, bio, role
 */
export const updateSpeakersBatch = async (data: Array<{ id: number } & CreateSpeakerInput>): Promise<void> => {
  try {
    await callApi(
      "PUT",
      `speakers/batch-update`,
      data,
      true
    );
  } catch (error) {
    console.error("Failed to update speakers batch:", error);
    throw error;
  }
};
