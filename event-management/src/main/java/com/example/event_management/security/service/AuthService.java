package com.example.event_management.security.service;

import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.security.dto.LoginResponse;
import com.example.event_management.security.exception.AuthException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public LoginResponse loginAdmin(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthException("Tài khoản không tồn tại"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new AuthException("Sai mật khẩu");
        }

        if (!"ADMIN".equals(user.getRole().name())) {
            throw new AuthException("Chỉ ADMIN mới được phép đăng nhập tại đây");
        }

        Map<String, Object> claims = Map.of(
                "email", user.getEmail(),
                "role", user.getRole().name()
        );

        String token = jwtService.generateToken(user.getEmail(), claims);

        // Include user id in the response so the DTO matches other usages
        return new LoginResponse(token, user.getId());
    }
}
