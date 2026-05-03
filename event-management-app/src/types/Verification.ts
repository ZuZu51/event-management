// Verification types

export interface School {
  id: number;
  name: string;
  code: string;
  city: string;
}

export interface Department {
  id: number;
  name: string;
  code: string;
  schoolId: number;
}

export interface CheckAccountRequest {
  email: string;
}

export interface CheckAccountResponse {
  exists: boolean;
  requiresCompletion: boolean;
}

export interface CompleteSignupRequest {
  email: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: string; // Nam / Nữ / Khác
  schoolId: number;
  studentId: string;
  teacherId: string;
  departmentId: number;
  role?: string; // STUDENT or TEACHER
}

export interface CompleteSignupResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface VerifyEmailRequest {
  email: string;
  token: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
  userId: number;
  email: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  success: boolean;
  message: string;
  email: string;
}

export interface SignupFormData {
  email: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  schoolId: number | null;
  departmentId: number | null;
  studentId: string;
  teacherId: string;
  role?: string; // STUDENT or TEACHER
}

export interface VerificationState {
  step: 'info' | 'verification'; // Current step
  email: string;
  loading: boolean;
  error: string | null;
  message: string | null;
  attempts: number; // Verification attempts
  resendCountdown: number; // Countdown in seconds
}
