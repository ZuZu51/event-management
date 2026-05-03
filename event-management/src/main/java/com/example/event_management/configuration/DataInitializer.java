package com.example.event_management.configuration;

import com.example.event_management.User.entity.Role;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Kiểm tra nếu chưa có user ADMIN nào trong DB
        boolean adminExists = userRepository.existsByRole(Role.ADMIN);

        if (!adminExists) {
            User admin = User.builder()
                    .name("System Administrator")
                    .email("admin@system.com")
                    .googleId("SYSTEM_ADMIN")
                    .password(passwordEncoder.encode("admin123")) // Mật khẩu mặc định
                    .role(Role.ADMIN)
                    .active(true)
                    .isFirstLogin(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .birthday(LocalDate.of(1990, 1, 1))
                    .build();

            userRepository.save(admin);
            System.out.println("✅ Default ADMIN account created: admin@system.com / admin123");
        } else {
            System.out.println("ℹ️ Admin account already exists, skipping initialization.");
        }
    }
}
