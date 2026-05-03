import { callApi } from "../common/helper/callApi";

export interface EventResource {
  id: number;
  eventId: number;
  uploadedBy: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const ALLOWED_TYPES = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"];
const MAX_SIZE = 100 * 1024 * 1024; // 100MB

const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

export const uploadResource = async (
  eventId: number,
  files: File | File[]
): Promise<EventResource[]> => {
  const fileArray = Array.isArray(files) ? files : [files];

  for (const file of fileArray) {
    const fileExt = getFileExtension(file.name);

    if (!ALLOWED_TYPES.includes(fileExt)) {
      throw new Error(`Loại file không được phép: ${fileExt}. Cho phép: ${ALLOWED_TYPES.join(", ")}`);
    }

    if (file.size > MAX_SIZE) {
      throw new Error(`File ${file.name} vượt quá 100MB`);
    }
  }

  const formData = new FormData();
  fileArray.forEach((file) => {
    formData.append("files", file);
  });

  try {
    const response = await callApi<ApiResponse<EventResource[]>>(
      "POST",
      `events/${eventId}/resources`,
      formData,
      true
    );

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Upload thất bại");
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
};

export const getEventResources = async (
  eventId: number
): Promise<EventResource[]> => {
  try {
    const response = await callApi<ApiResponse<EventResource[]>>(
      "GET",
      `events/${eventId}/resources`,
      undefined,
      true
    );

    if (response.success && response.data) {
      return response.data;
    }
    return [];
  } catch (error) {
    console.error("Get resources error:", error);
    throw error;
  }
};

export const downloadFile = async (
  eventId: number,
  resourceId: number,
  fileName: string
): Promise<void> => {
  try {
    const response = await callApi<Blob>(
      "GET",
      `events/${eventId}/resources/${resourceId}/download`,
      undefined,
      true,
      { responseType: "blob" as const }
    );

    // response.data is already the blob when responseType is blob
    const blob = response as unknown as Blob;
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};

export const deleteResource = async (
  eventId: number,
  resourceId: number
): Promise<void> => {
  try {
    await callApi(
      "DELETE",
      `events/${eventId}/resources/${resourceId}`,
      undefined,
      true
    );
  } catch (error) {
    console.error("Delete error:", error);
    throw error;
  }
};
