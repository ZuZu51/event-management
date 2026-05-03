package com.example.event_management.security.service;

import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class CustomOAuth2SuccessHandler implements org.springframework.security.web.authentication.AuthenticationSuccessHandler {

    private final UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String userStatus = (String) oAuth2User.getAttribute("userStatus");

        // ✅ User mới → Redirect tới Complete Signup Form
        if ("NEW".equals(userStatus)) {
            String name = oAuth2User.getAttribute("name");
            String avatar = oAuth2User.getAttribute("avatar");
            String googleId = oAuth2User.getAttribute("googleId");
            String accessToken = oAuth2User.getAttribute("accessToken");
            String refreshToken = oAuth2User.getAttribute("refreshToken");
            String role = oAuth2User.getAttribute("role");
            
            String redirectUrl = "http://localhost:5173/complete-signup" +
                    "?email=" + URLEncoder.encode(email, StandardCharsets.UTF_8) +
                    "&name=" + URLEncoder.encode(name != null ? name : "", StandardCharsets.UTF_8) +
                    "&avatar=" + URLEncoder.encode(avatar != null ? avatar : "", StandardCharsets.UTF_8) +
                    "&googleId=" + URLEncoder.encode(googleId != null ? googleId : "", StandardCharsets.UTF_8) +
                    "&accessToken=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8) +
                    "&refreshToken=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8) +
                    "&role=" + role;
            
            response.sendRedirect(redirectUrl);
            return;
        }

        // ✅ User tồn tại → Login bình thường
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            response.sendRedirect("http://localhost:5173/login?error=nouser");
            return;
        }

        User user = userOpt.get();
        String accessToken = oAuth2User.getAttribute("accessToken");
        String refreshToken = oAuth2User.getAttribute("refreshToken");
        String avatar = user.getAvatar();
        String faculty = user.getFaculty();

        // Redirect về FE cùng với token & thông tin người dùng
        String redirectUrl = "http://localhost:5173/oauth2/success" +
                "?accessToken=" + URLEncoder.encode(accessToken, StandardCharsets.UTF_8) +
                "&refreshToken=" + URLEncoder.encode(refreshToken, StandardCharsets.UTF_8) +
                "&email=" + URLEncoder.encode(email, StandardCharsets.UTF_8) +
                "&name=" + URLEncoder.encode(user.getName(), StandardCharsets.UTF_8) +
                "&avatar=" + URLEncoder.encode(avatar != null ? avatar : "", StandardCharsets.UTF_8) +
                "&faculty=" + URLEncoder.encode(faculty != null ? faculty : "", StandardCharsets.UTF_8) +
                "&role=" + user.getRole() +
                "&idUser=" + user.getId();

        response.sendRedirect(redirectUrl);
    }
}