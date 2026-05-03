package com.example.event_management.User.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.example.event_management.User.entity.VerificationToken;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByEmailAndToken(String email, String token);
    Optional<VerificationToken> findLatestByEmail(String email);
    List<VerificationToken> findByExpiresAtBefore(LocalDateTime dateTime);
    void deleteByExpiresAtBefore(LocalDateTime dateTime);
}
