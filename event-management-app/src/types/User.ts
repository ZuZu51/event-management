export interface User {
  id: number;
  name: string;
  email: string;
  googleId?: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  active: boolean;
  isFirstLogin?: boolean;
  createdAt: string;
  updatedAt: string;
  birthday?: string;
  emailVerified?: boolean;
}
