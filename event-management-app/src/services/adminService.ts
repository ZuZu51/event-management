import { callApi } from "../common/helper/callApi";
import type { User } from "../types/User";

// DTOs for history records
export interface RegistrationHistoryDTO {
  ticketId: number;
  userId: number;
  userName: string;
  userEmail: string;
  eventId: number;
  eventName: string;
  registrationDate: string;
  price: number;
  status: "VALID" | "USED" | "EXPIRED" | "CANCELLED";
  ticketCode: string;
}

export interface PaymentHistoryDTO {
  paymentId: number;
  userId: number;
  userName: string;
  eventId: number;
  eventName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  status: "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";
  transactionCode: string;
}

export interface AttendanceHistoryDTO {
  recordId: number;
  userId: number;
  userName: string;
  userEmail: string;
  eventId: number;
  eventName: string;
  checkInTime: string;
  checkOutTime?: string;
  location: string;
  attendanceStatus: "CHECKED_IN" | "CHECKED_OUT";
}

export interface EventHistoryDTO {
  historyId: number;
  creatorId: number;
  creatorName: string;
  eventId: number;
  eventName: string;
  actionType: "CREATE" | "UPDATE" | "DELETE";
  actionDate: string;
  eventStatus: string;
}

// User management API functions
export const adminService = {
  // ===== USER MANAGEMENT =====
  async getAllUsers(): Promise<User[]> {
    return callApi<User[]>("GET", "admin/users", undefined, true);
  },

  async getUserById(userId: number): Promise<User> {
    return callApi<User>("GET", `admin/users/${userId}`, undefined, true);
  },

  async updateUserRole(
    userId: number,
    role: "ADMIN" | "TEACHER" | "STUDENT"
  ): Promise<User> {
    return callApi<User>(
      "PUT",
      `admin/users/${userId}/role`,
      { role },
      true
    );
  },

  async toggleUserStatus(userId: number): Promise<User> {
    return callApi<User>(
      "PUT",
      `admin/users/${userId}/toggle-status`,
      undefined,
      true
    );
  },

  async deleteUser(userId: number): Promise<{ message: string }> {
    return callApi<{ message: string }>(
      "DELETE",
      `admin/users/${userId}`,
      undefined,
      true
    );
  },

  async searchUsers(keyword: string): Promise<User[]> {
    return callApi<User[]>(
      "GET",
      `admin/users/search?keyword=${encodeURIComponent(keyword)}`,
      undefined,
      true
    );
  },

  // ===== REGISTRATION HISTORY =====
  async getRegistrationHistory(): Promise<RegistrationHistoryDTO[]> {
    return callApi<RegistrationHistoryDTO[]>(
      "GET",
      "admin/registrations",
      undefined,
      true
    );
  },

  async getUserRegistrationHistory(
    userId: number
  ): Promise<RegistrationHistoryDTO[]> {
    return callApi<RegistrationHistoryDTO[]>(
      "GET",
      `admin/registrations/user/${userId}`,
      undefined,
      true
    );
  },

  // ===== PAYMENT HISTORY =====
  async getPaymentHistory(): Promise<PaymentHistoryDTO[]> {
    return callApi<PaymentHistoryDTO[]>(
      "GET",
      "admin/payments",
      undefined,
      true
    );
  },

  async getUserPaymentHistory(userId: number): Promise<PaymentHistoryDTO[]> {
    return callApi<PaymentHistoryDTO[]>(
      "GET",
      `admin/payments/user/${userId}`,
      undefined,
      true
    );
  },

  // ===== ATTENDANCE HISTORY =====
  async getAttendanceHistory(): Promise<AttendanceHistoryDTO[]> {
    return callApi<AttendanceHistoryDTO[]>(
      "GET",
      "admin/attendances",
      undefined,
      true
    );
  },

  async getUserAttendanceHistory(
    userId: number
  ): Promise<AttendanceHistoryDTO[]> {
    return callApi<AttendanceHistoryDTO[]>(
      "GET",
      `admin/attendances/user/${userId}`,
      undefined,
      true
    );
  },

  // ===== EVENT MANAGEMENT HISTORY =====
  async getEventManagementHistory(): Promise<EventHistoryDTO[]> {
    return callApi<EventHistoryDTO[]>(
      "GET",
      "admin/event-history",
      undefined,
      true
    );
  },

  async getUserEventHistory(userId: number): Promise<EventHistoryDTO[]> {
    return callApi<EventHistoryDTO[]>(
      "GET",
      `admin/event-history/user/${userId}`,
      undefined,
      true
    );
  },

  async getEventHistory(eventId: number): Promise<EventHistoryDTO[]> {
    return callApi<EventHistoryDTO[]>(
      "GET",
      `admin/event-history/event/${eventId}`,
      undefined,
      true
    );
  },

  // ===== STATISTICS =====
  async getStats(): Promise<{
    totalUsers: number;
    totalActiveUsers: number;
    totalRegistrations: number;
    totalPayments: number;
  }> {
    return callApi<{
      totalUsers: number;
      totalActiveUsers: number;
      totalRegistrations: number;
      totalPayments: number;
    }>("GET", "admin/stats", undefined, true);
  },
};
