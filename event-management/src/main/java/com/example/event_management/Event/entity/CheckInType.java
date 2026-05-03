package com.example.event_management.Event.entity;

/**
 * Enum định nghĩa phương thức điểm danh cho sự kiện
 * NONE: Không sử dụng điểm danh
 * AUTO: Tự động check-in dựa trên thời gian hệ thống (dùng AttendanceSession)
 * QR_SCAN: Quét mã QR (dùng Ticket)
 * BOTH: Cả 2 phương thức (tự động + quét mã)
 */
public enum CheckInType {
    NONE,      // Không điểm danh
    AUTO,      // Tự động - check-in based on system time (AttendanceSession)
    QR_SCAN,   // Quét mã - check-in by QR code scanning (Ticket)
    BOTH       // Cả 2 - both methods allowed
}
