package com.example.event_management.Event.dto;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.example.event_management.Event.entity.Mode;
import com.example.event_management.Event.entity.CheckInType;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventScheduleUpdateDTO {
    // Core schedule fields
    private LocalDate date;
    private LocalTime startTime;
    private String location;

    // Additional editable metadata
    private String name;
    private String description;
    private Integer durationMinutes;

    private Boolean ticketed;
    private Long ticketPrice;

    private Long categoryId;
    private Mode mode;
    private String organizer;

    private String joinLink;
    private String qaLink;

    // Số lượng người tối đa có thể tham gia (null = không giới hạn)
    private Integer quantity;

    // Cờ sự kiện chỉ được mời
    //private Boolean isInvite;

    // Cờ sự kiện chỉ dành cho sinh viên của trường
    private Boolean isForSchool;

    // Danh sách trường được phép tham gia (khi isForSchool = true)
    private List<Long> allowedSchoolIds;

    // Cờ cho phép đăng ký sự kiện
    private Boolean isOpen;

    // Phương thức điểm danh: AUTO (tự động), QR_SCAN (quét mã), BOTH (cả 2)
    private CheckInType checkInType;

    // Check-in/Check-out times
    private LocalTime checkinStart;
    private LocalTime checkinEnd;
    private LocalTime checkoutStart;
    private LocalTime checkoutEnd;

    // Image fields
    private String imagePath;
    private String imagePublicId;

    // Location coordinates from Google Maps
    private Double latitude;
    private Double longitude;
    private Integer radiusMeters;
}
