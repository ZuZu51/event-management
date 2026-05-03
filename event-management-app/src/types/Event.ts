export interface EventType {
  eventId: number;
  eventName: string;
  description: string;
  location: string;
  date: string;
  guestCount: number;
  speakerCount: number;
  ticketCount: number;
  eventMode: "ONLINE" | "OFFLINE" | "HYBRID";
  category: number;
  joinLink?: string;
  qaLink: string;
  startTime: string;
  durationMinutes: number;
  createdAt: Date;
  createdById?: number;
  active: number; // 0 | 1 | 2 | 3 | 4 (0: Đã hủy, 1: Sắp diễn ra, 2: Đang diễn ra, 3: Đã kết thúc, 4: Đã xóa)
  approvalStatus?: number; // 0: Hủy, 1: Chưa gửi, 2: Gửi duyệt, 3: Chấp thuận, 4: Từ chối
  ticketed: boolean;
  ticketPrice?: number;
  quantity?: number | null; // Số lượng người tối đa
  isForSchool?: boolean; // Sự kiện chỉ sinh viên trường
  isOpen?: boolean; // Cho phép đăng ký sự kiện
  // Optional image path returned by backend (e.g. /uploads/xyz.png)
  imagePath?: string;
  // Location coordinates from Google Maps
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
}

export interface CreateEventInput {
  name: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationMinutes: number;
  location: string;
  categoryId: number; // Changed from category enum to categoryId (FK)
  organizer: string;
  active?: number; // 0 hoặc 1, default 1
  mode: "ONLINE" | "OFFLINE" | "HYBRID";
  joinLink?: string;
  qaLink?: string;
  ticketed: boolean;
  ticketPrice?: number;
  quantity?: number | null; // Số lượng người tối đa (null = không giới hạn)
  isForSchool?: boolean; // Sự kiện chỉ sinh viên trường
  allowedSchoolIds?: number[]; // Danh sách trường được phép tham gia (khi isForSchool = true)
  isOpen?: boolean; // Cho phép đăng ký sự kiện (default false)
  // Whether attendance/checkin is enabled for this event
  isAttendance?: boolean;
  // Check-in type: AUTO, QR_SCAN, BOTH
  checkInType?: "AUTO" | "QR_SCAN" | "BOTH";
  // Location coordinates from Google Maps
  latitude?: number;
  longitude?: number;
  radiusMeters?: number; // Default 100m
}

export interface EventStats {
  eventId: number;
  eventName: string;
  description: string;
  date: string;
  startTime: string;
  location: string;
  durationMinutes: number;
  category: string;
  createdAt: string;
  qalink: string;
  ticketed: boolean;
  ticketPrice?: number;
  createdById?: number;
  quantity?: number | 0; // Số lượng người tối đa
  
  organizer?: string;
  joinLink?: string;
  imagePath?: string;

  // Trạng thái sự kiện
  eventMode: "ONLINE" | "OFFLINE" | "HYBRID";
  active: 0 | 1 | 2 | 3 | 4;
  // (0: Đã hủy, 1: Sắp diễn ra, 2: Đang diễn ra, 3: Đã kết thúc, 4: Đã xóa)
  
  // Check-in type
  checkInType?: "AUTO" | "QR_SCAN" | "BOTH" | "NONE";

  // Dữ liệu JSON mới (chuỗi JSON từ backend)
  guests?: string;
  speakers?: string;

  // Event visibility flags
  isForSchool?: boolean; // Sự kiện chỉ sinh viên trường
  isOpen?: boolean; // Cho phép đăng ký sự kiện
  latitude?: number;
  longitude?: number;

}

export interface UserEventDTO {
  eventId: number;
  eventName: string;
  date: string;
  startTime: string;
  location: string;
  status: string;
  checkInTime: string;
  checkOutTime: string;
  invitationStatus?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';
}
