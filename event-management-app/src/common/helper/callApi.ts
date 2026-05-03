import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  Method,
} from "axios";
import axios from "axios";
import { localStorageHelper } from "./localStorageHelper";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/";

export const callApi = async <TResponse = unknown, TData = unknown>(
  method: Method,
  url: string,
  data?: TData,
  needAuth: boolean = false,
  config?: AxiosRequestConfig
): Promise<TResponse> => {
  // Cấu hình header mặc định
  const headers: Record<string, string> = {};

  // Nếu data không phải FormData thì đặt Content-Type là JSON.
  // Nếu data là FormData, browser sẽ tự thêm boundary, nên không set header này.
  // Nếu responseType là blob, cũng không set Content-Type
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (!(data instanceof FormData) && config?.responseType !== "blob") {
    headers["Content-Type"] = "application/json";
  }

  // Nếu cần Auth, thêm Authorization header
  if (needAuth) {
    try {
      // ✅ Lấy authData từ localStorage và parse sẵn
      const authData = localStorageHelper.getItem<{ token: string }>("token");

      if (authData?.token) {
        headers["Authorization"] = `Bearer ${authData.token}`;
      } else {
        throw new Error("Token is missing in auth token.");
      }
    } catch (error) {
      console.error("Error while retrieving auth token:", error);
      throw new Error(
        "Failed to retrieve authentication token from localStorage."
      );
    }
  }

  try {
    // Gọi API với axios
    const response: AxiosResponse<TResponse> = await axios({
      method,
      url: `${API_BASE_URL}${url}`,
      data,
      headers,
      withCredentials: true,
      ...config, // Merge các cấu hình bổ sung từ tham số config
    });

    return response.data; // Trả về dữ liệu từ response
  } catch (error) {
    const axiosError = error as AxiosError;

    console.error(`API ${method} ${url} failed`, axiosError);

    // Nếu có lỗi trả về từ API (có response.data)
    if (axiosError.response?.data) {
      // Trả về dữ liệu lỗi từ API
      throw axiosError.response.data;
    }

    // Nếu không có response (chắc là lỗi mạng, timeout...)
    throw new Error(axiosError.message);
  }
};
