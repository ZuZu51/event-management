package com.example.event_management.Event.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.example.event_management.User.entity.School;

@Entity
@Table(name = "event_school_access")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EventSchoolAccess {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne
    @JoinColumn(name = "school_id", nullable = false)
    private School school;
}
