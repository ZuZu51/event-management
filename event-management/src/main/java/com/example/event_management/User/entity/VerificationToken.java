package com.example.event_management.User.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_tokens", indexes = {
    @Index(name = "idx_email", columnList = "email"),
    @Index(name = "idx_expires_at", columnList = "expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerificationToken {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String email;
    
    @Column(nullable = false, length = 6)
    private String token;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    @Column(nullable = false)
    private LocalDateTime expiresAt;
    
    @Column(nullable = false)
    private Integer attempts = 0;
    
    @Column(nullable = false)
    private Boolean isVerified = false;
    
    // For storing incomplete signup data temporarily
    @Column(columnDefinition = "TEXT")
    private String signupData; // JSON string with user info
    
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
    
    public boolean isAttemptsExceeded() {
        return attempts >= 5;
    }
}
