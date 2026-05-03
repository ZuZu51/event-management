package com.example.event_management.security.service;

import com.example.event_management.User.entity.Role;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.security.jwt.JwtTokenProvider;
import com.example.event_management.utils.FacultyUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        // Lấy thông tin user từ Google
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");
        String avatar = oAuth2User.getAttribute("picture");

        if (email == null) {
            throw new OAuth2AuthenticationException("Email not found from Google account");
        }

        // Phân tích domain email để xác định role và thông tin khoa
        String idPart = email.substring(0, email.indexOf('@'));
        String domain = email.substring(email.indexOf('@') + 1);

        Role role = Role.STUDENT;
        String studentId = null;
        String teacherId = null;
        String faculty = null;

        if (domain.contains("student")) {
            role = Role.STUDENT;
            studentId = idPart;

            // Lấy ký tự đầu để xác định khoa
            char firstChar = Character.toUpperCase(idPart.charAt(0));
            faculty = FacultyUtils.getFacultyName(firstChar);

        } else if (domain.contains("tdtu") || domain.contains("faculty")) {
            role = Role.TEACHER;
            teacherId = idPart;
        } else if (domain.contains("admin")) {
            role = Role.ADMIN;
        } else {
            role = Role.GUEST;
            faculty = "Khách ngoài hệ thống";
        }

        // Tìm user trong DB
        Optional<User> userOpt = userRepository.findByEmail(email);
        
        // ✅ Luồng mới: Không tự động tạo user
        // Để cho SuccessHandler xử lý redirect
        String accessToken = null;
        String refreshToken = null;
        String userStatus = "NEW"; // NEW hoặc EXISTING
        
        if (userOpt.isPresent()) {
            // User tồn tại → cập nhật lastLogin
            User user = userOpt.get();
            user.setLastLogin(LocalDateTime.now());
            user.setFirstLogin(false);
            if (faculty != null) user.setFaculty(faculty);
            
            userRepository.save(user);
            
            // Tạo token (bao gồm userId)
            accessToken = jwtTokenProvider.generateToken(user.getEmail(), String.valueOf(user.getRole()), user.getId());
            refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());
            userStatus = "EXISTING";
        } else {
            // User mới → gửi thông tin để Complete Signup Form xử lý
            // Vẫn tạo token tạm thời cho frontend (nhưng không có userId vì user chưa tạo)
            accessToken = jwtTokenProvider.generateToken(email, String.valueOf(role));
            refreshToken = jwtTokenProvider.generateRefreshToken(email);
            userStatus = "NEW";
        }

        // Trả về OAuth2User cho Spring Security
        java.util.Map<String, Object> attributes = new java.util.HashMap<>();
        attributes.put("email", email);
        attributes.put("name", name);
        attributes.put("avatar", avatar);
        attributes.put("faculty", faculty);
        attributes.put("studentId", studentId != null ? studentId : "");
        attributes.put("teacherId", teacherId != null ? teacherId : "");
        attributes.put("googleId", googleId);
        attributes.put("accessToken", accessToken);
        attributes.put("refreshToken", refreshToken);
        attributes.put("userStatus", userStatus);
        attributes.put("role", role.name());
        
        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority("ROLE_" + role.name())),
                attributes,
                "email"
        );
    }
}
