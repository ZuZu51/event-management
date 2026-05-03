import { callApi } from "../common/helper/callApi";
import type { LoginRequest, LoginResponse } from "../types/Authen";
import type {
  CheckAccountRequest,
  CheckAccountResponse,
  CompleteSignupRequest,
  CompleteSignupResponse,
  VerifyEmailRequest,
  VerifyEmailResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  School,
  Department,
} from "../types/Verification";

export const AuthService = {
  /**
   * Gọi API đăng nhập
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const data: LoginRequest = { email, password };
    return await callApi<LoginResponse, LoginRequest>(
      "POST",
      "api/auth/login",
      data,
      false
    );
  },

  /**
   * Kiểm tra tài khoản có tồn tại hay không
   */
  checkAccount: async (email: string): Promise<CheckAccountResponse> => {
    const data: CheckAccountRequest = { email };
    return await callApi<CheckAccountResponse, CheckAccountRequest>(
      "POST",
      "api/auth/check-account",
      data,
      false
    );
  },

  /**
   * Hoàn thành signup - lưu thông tin và gửi verification email
   */
  completeSignup: async (
    request: CompleteSignupRequest
  ): Promise<CompleteSignupResponse> => {
    return await callApi<CompleteSignupResponse, CompleteSignupRequest>(
      "POST",
      "api/auth/complete-signup",
      request,
      false
    );
  },

  /**
   * Xác minh email
   */
  verifyEmail: async (
    request: VerifyEmailRequest
  ): Promise<VerifyEmailResponse> => {
    return await callApi<VerifyEmailResponse, VerifyEmailRequest>(
      "POST",
      "api/auth/verify-email",
      request,
      false
    );
  },

  /**
   * Gửi lại mã xác minh
   */
  resendVerification: async (
    request: ResendVerificationRequest
  ): Promise<ResendVerificationResponse> => {
    return await callApi<ResendVerificationResponse, ResendVerificationRequest>(
      "POST",
      "api/auth/resend-verification",
      request,
      false
    );
  },

  /**
   * Lấy danh sách các trường
   */
  getSchools: async (): Promise<School[]> => {
    return await callApi<School[], null>("GET", "api/auth/schools", null, false);
  },

  /**
   * Lấy danh sách khoa theo trường
   */
  getDepartments: async (schoolId: number): Promise<Department[]> => {
    return await callApi<Department[], null>(
      "GET",
      `api/auth/departments?schoolId=${schoolId}`,
      null,
      false
    );
  },

  /**
   * Kiểm tra studentId đã tồn tại hay không
   */
  checkStudentIdExists: async (studentId: string): Promise<boolean> => {
    try {
      const response = await callApi<{ exists: boolean }, null>(
        "GET",
        `api/auth/check-student-id?studentId=${encodeURIComponent(studentId)}`,
        null,
        false
      );
      return response.exists;
    } catch (error) {
      return false;
    }
  },

  /**
   * Kiểm tra teacherId đã tồn tại hay không
   */
  checkTeacherIdExists: async (teacherId: string): Promise<boolean> => {
    try {
      const response = await callApi<{ exists: boolean }, null>(
        "GET",
        `api/auth/check-teacher-id?teacherId=${encodeURIComponent(teacherId)}`,
        null,
        false
      );
      return response.exists;
    } catch (error) {
      return false;
    }
  },
};
