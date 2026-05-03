package com.example.event_management.Event.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã id ngẫu nhiên 8 ký tự
    @Column(nullable = false, unique = true, updatable = false)
    @Builder.Default
    private String customId = UUID.randomUUID().toString().substring(0, 8);

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    // --- Thời gian bắt đầu ---
    @Column(nullable = false)
    private LocalTime startTime;

    // --- Thời lượng sự kiện (tính bằng phút) ---
    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private Boolean ticketed = false;

    // Giá vé (nullable nếu ticketed = false)
    private Long ticketPrice = 0L;

    // Liên kết tới bảng event_categories
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private EventCategory eventCategory;

    @Column(nullable = false)
    private String organizer;

    @Column(nullable = false)
    private Integer active = 0; // 0: inactive, 1: active, v.v.

    // Trạng thái duyệt sự kiện: 0 = Hủy, 1 = Chưa gửi, 2 = Gửi duyệt, 3 = Chấp thuận, 4 = Từ chối
    @Column(nullable = false)
    private Integer approvalStatus = 1; // Mặc định là 1 (Chưa gửi)

    // Hình thức tổ chức: ONLINE / OFFLINE / HYBRID
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Mode mode;

    // Link để join event nếu online/hybrid
    private String joinLink;

    // Link để đặt QAs (Google Form hoặc link khác)
    private String qaLink;

    // URL của ảnh đại diện (có thể là Cloudinary secure_url)
    @Column(name = "image_path")
    private String imagePath;

    // Cloudinary public_id (nếu upload lên Cloudinary)
    @Column(name = "image_public_id")
    private String imagePublicId;

    // ID người tạo (tham chiếu tới bảng người dùng, lưu riêng id để đơn giản)
    @Column(name = "created_by_id")
    private Long createdById;

    // Cờ bật/tắt chức năng điểm danh cho event này
//    @Column(name = "is_attendance", nullable = false)
//    private Boolean isAttendance = false;

    // Số lượng người tối đa có thể tham gia (null = không giới hạn)
    @Column(name = "quantity")
    private Integer quantity;

    // Cờ sự kiện chỉ được mời (true = chỉ được mời, false = không)
    // @Column(name = "is_invite", nullable = false)
    // private Boolean isInvite = false;

    // Cờ sự kiện chỉ dành cho sinh viên của trường (true = chỉ sinh viên trường, false = mở rộng)
    @Column(name = "is_for_school", nullable = false)
    private Boolean isForSchool = false;

    // Cờ cho phép đăng ký sự kiện (true = mở đăng ký, false = đóng đăng ký)
    @Column(name = "is_open", nullable = false)
    private Boolean isOpen = true;

    // Phương thức điểm danh: NONE (không), AUTO (tự động), QR_SCAN (quét mã), BOTH (cả 2)
    @Enumerated(EnumType.STRING)
    @Column(name = "check_in_type", nullable = false, length = 20)
    private CheckInType checkInType = CheckInType.NONE;

    // --- Vị trí địa lý ---
    @Column(name = "latitude")
    private Double latitude;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "radius_meters")
    private Integer radiusMeters; // Bán kính check-in (mặc định 100m)

    // --- Timestamps ---
    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

}
