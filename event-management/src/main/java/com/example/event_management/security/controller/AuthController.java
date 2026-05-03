package com.example.event_management.security.controller;

import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.security.dto.LoginRequest;
import com.example.event_management.security.dto.LoginResponse;
import com.example.event_management.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> loginAdmin(@RequestBody LoginRequest request) {
        try {
            log.debug("login request: {}", request);

            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            // Fetch user to get userId
            var user = userRepository.findByEmail(authentication.getName());
            if (user.isEmpty()) {
                log.error("User not found: {}", authentication.getName());
                return ResponseEntity.status(401).build();
            }

            Long userId = user.get().getId();
            String token = tokenProvider.generateToken(authentication.getName(), "ROLE_ADMIN", userId);

            return ResponseEntity.ok(new LoginResponse(token, userId));
        } catch (AuthenticationException e) {
            log.error("Login Failed: {}", e.getMessage());
            return ResponseEntity.status(401).build();
        }
    }

    @GetMapping("/success")
    public String loginSuccess(@AuthenticationPrincipal OAuth2User user) {
        return "Chào mừng " + user.getAttribute("name") + " (" + user.getAttribute("email") + ")";
    }

    @GetMapping("/public/hello")
    public String hello() {
        return "Public API — không cần login";
    }

    @GetMapping("/check-student-id")
    public ResponseEntity<?> checkStudentIdExists(@RequestParam String studentId) {
        boolean exists = userRepository.existsByStudentId(studentId);
        return ResponseEntity.ok(new java.util.HashMap<String, Boolean>() {{
            put("exists", exists);
        }});
    }

    @GetMapping("/check-teacher-id")
    public ResponseEntity<?> checkTeacherIdExists(@RequestParam String teacherId) {
        boolean exists = userRepository.existsByTeacherId(teacherId);
        return ResponseEntity.ok(new java.util.HashMap<String, Boolean>() {{
            put("exists", exists);
        }});
    }
}


