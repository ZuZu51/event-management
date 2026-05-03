package com.example.event_management.utils;

public class FacultyUtils {

    private FacultyUtils() {
    }

    public static String getFacultyName(char code) {
        code = Character.toUpperCase(code);
        return switch (code) {
            case '0' -> "KHOA NGOẠI NGỮ";
            case '1' -> "KHOA MĨ THUẬT CÔNG NGHIỆP";
            case '2' -> "KHOA KẾ TOÁN";
            case '3' -> "KHOA KHXH & NHÂN VĂN";
            case '4' -> "KHOA ĐIỆN - ĐIỆN TỬ";
            case '5' -> "KHOA CÔNG NGHỆ THÔNG TIN";
            case '6' -> "KHOA KHOA HỌC ỨNG DỤNG";
            case '7' -> "KHOA QUẢN TRỊ KINH DOANH";
            case '8' -> "KHOA KĨ THUẬT CÔNG TRÌNH";
            case '9' -> "KHOA MÔI TRƯỜNG & BHLĐ";
            case 'A' -> "KHOA LAO ĐỘNG CÔNG ĐOÀN";
            case 'B' -> "KHOA TÀI CHÍNH NGÂN HÀNG";
            case 'C' -> "KHOA TOÁN - THỐNG KÊ";
            case 'D' -> "KHOA KHOA HỌC THỂ THAO";
            case 'E' -> "KHOA LUẬT";
            case 'F', 'G' -> "KHOA GIÁO DỤC QUỐC TẾ";
            case 'H' -> "KHOA DƯỢC";
            default -> "KHÔNG XÁC ĐỊNH";
        };
    }
}
