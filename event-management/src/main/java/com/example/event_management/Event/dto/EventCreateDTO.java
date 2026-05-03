package com.example.event_management.Event.dto;

import com.example.event_management.Event.entity.Mode;
import com.example.event_management.Event.entity.CheckInType;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventCreateDTO {
    private String name;
    private String description;
    private LocalDate date;
    private LocalTime startTime;
    private Integer durationMinutes;
    private String location;
    private Long categoryId;  // Foreign Key to EventCategory
    private String organizer;
    private Integer active;
    private Integer approvalStatus; // Trạng thái duyệt: 0 = Hủy, 1 = Chưa gửi, 2 = Gửi duyệt, 3 = Chấp thuận, 4 = Từ chối
    
    private Boolean ticketed;
    private Long ticketPrice;
    
    private Mode mode;
    private String joinLink;
    private String qaLink;
    
    private String imagePath;
    private String imagePublicId;
    
    private Long createdById;
    
    private Boolean isAttendance;
    private Integer quantity;
    //private Boolean isInvite;
    private Boolean isForSchool;
    private List<Long> allowedSchoolIds; // Danh sách ID trường được phép tham gia (khi isForSchool = true)
    private Boolean isOpen;
    private CheckInType checkInType;
    
    // --- Location fields from Google Maps ---
    private Double latitude;
    private Double longitude;
    private Integer radiusMeters;
}
