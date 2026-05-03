package com.example.event_management.Speaker.entity;

import com.example.event_management.Event.entity.Event;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "speakers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Speaker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Tên diễn giả hoặc khách mời
    @Column(nullable = false)
    private String name;

    // Tiểu sử hoặc mô tả ngắn
    @Column(nullable = false, columnDefinition = "TEXT")
    private String bio;

    // Liên kết đến sự kiện
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // Vai trò: speaker hoặc guest
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

}
