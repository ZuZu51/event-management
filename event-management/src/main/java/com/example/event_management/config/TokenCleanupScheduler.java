package com.example.event_management.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.example.event_management.User.repository.VerificationTokenRepository;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class TokenCleanupScheduler {
    
    private final VerificationTokenRepository verificationTokenRepository;
    
    /**
     * Xóa các verification tokens đã hết hạn
     * Chạy mỗi 10 phút
     */
    @Scheduled(fixedRate = 600000) // 10 minutes
    @Transactional
    public void cleanupExpiredTokens() {
        try {
            LocalDateTime now = LocalDateTime.now();
            verificationTokenRepository.deleteByExpiresAtBefore(now);
            log.info("Expired verification tokens cleaned up");
        } catch (Exception e) {
            log.error("Error cleaning up expired tokens", e);
        }
    }
}
