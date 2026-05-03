package com.example.event_management.security.service;

import com.example.event_management.User.entity.User;
import com.example.event_management.User.service.UserService;
import lombok.AllArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@AllArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserService userService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Optional<User> optionalUser = userService.getUserByEmail(email);

        User user = optionalUser.orElseThrow(
                () -> new UsernameNotFoundException("User not found with email: " + email)
        );

        // ⚠️ Nếu user login bằng Google → password = null
        String password = user.getPassword();
        if (password == null || password.isBlank()) {
            // Gán mật khẩu tạm để tránh lỗi IllegalArgumentException
            // "{noop}" = password không mã hóa, dùng cho tài khoản OAuth2
            password = "{noop}OAUTH2_USER";
        }

        return org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(password)
                .roles(user.getRole().name())
                .disabled(!user.isActive())
                .build();
    }
}
