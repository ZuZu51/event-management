package com.example.event_management.security.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import com.example.event_management.User.entity.VerificationToken;
import com.example.event_management.User.entity.School;
import com.example.event_management.User.entity.Department;
import com.example.event_management.User.entity.Role;
import com.example.event_management.User.repository.VerificationTokenRepository;
import com.example.event_management.User.repository.SchoolRepository;
import com.example.event_management.User.repository.DepartmentRepository;
import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.User.entity.User;
import com.example.event_management.Mail.service.EmailService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationService {
    
    private final VerificationTokenRepository verificationTokenRepository;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final DepartmentRepository departmentRepository;
    private final EmailService emailService;
    private final ObjectMapper objectMapper;
    
    private static final int TOKEN_EXPIRY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 5;
    private static final String ALLOWED_CHARS = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; // Avoid I, L, O, 0
    
    /**
     * Kiểm tra tài khoản có tồn tại hay không
     */
    public boolean accountExists(String email) {
        return userRepository.findByEmail(email).isPresent();
    }
    
    /**
     * Tạo verification token và gửi email
     */
    public void createAndSendVerificationToken(String email, String signupDataJson) {
        try {
            // Xóa token cũ nếu tồn tại
            Optional<VerificationToken> existingToken = verificationTokenRepository.findLatestByEmail(email);
            if (existingToken.isPresent()) {
                verificationTokenRepository.delete(existingToken.get());
            }
            
            // Tạo token mới
            String token = generateVerificationToken();
            VerificationToken verificationToken = new VerificationToken();
            verificationToken.setEmail(email);
            verificationToken.setToken(token);
            verificationToken.setCreatedAt(LocalDateTime.now());
            verificationToken.setExpiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES));
            verificationToken.setAttempts(0);
            verificationToken.setIsVerified(false);
            verificationToken.setSignupData(signupDataJson);
            
            verificationTokenRepository.save(verificationToken);
            
            // Gửi email
            emailService.sendVerificationEmail(email, token);
            log.info("Verification token created and email sent to: {}", email);
        } catch (Exception e) {
            log.error("Error creating verification token for email: {}", email, e);
            throw new RuntimeException("Failed to create verification token", e);
        }
    }
    
    /**
     * Xác minh token và tạo user
     */
    public User verifyTokenAndCreateUser(String email, String token) {
        Optional<VerificationToken> verificationTokenOpt = verificationTokenRepository.findByEmailAndToken(email, token);
        
        if (verificationTokenOpt.isEmpty()) {
            throw new IllegalArgumentException("Verification token not found");
        }
        
        VerificationToken verificationToken = verificationTokenOpt.get();
        
        // Kiểm tra hết hạn
        if (verificationToken.isExpired()) {
            verificationTokenRepository.delete(verificationToken);
            throw new IllegalArgumentException("Verification token has expired");
        }
        
        // Kiểm tra số lần thử
        if (verificationToken.isAttemptsExceeded()) {
            verificationTokenRepository.delete(verificationToken);
            throw new IllegalArgumentException("Too many verification attempts. Please request a new verification code.");
        }
        
        // Tăng số lần thử
        verificationToken.setAttempts(verificationToken.getAttempts() + 1);
        
        // Kiểm tra mã
        if (!verificationToken.getToken().equals(token)) {
            verificationTokenRepository.save(verificationToken);
            throw new IllegalArgumentException("Invalid verification token");
        }
        
        // Đánh dấu đã xác minh
        verificationToken.setIsVerified(true);
        verificationTokenRepository.save(verificationToken);
        
        // Parse signup data từ JSON
        try {
            @SuppressWarnings("unchecked")
            java.util.Map<String, Object> signupData = objectMapper.readValue(
                verificationToken.getSignupData(), 
                java.util.Map.class
            );
            
            // Tạo user mới
            User user = new User();
            user.setEmail(email);
            user.setGoogleId(email); // Sử dụng email làm googleId tạm thời
            user.setName((String) signupData.get("fullName"));
            user.setFullName((String) signupData.get("fullName"));
            user.setGender((String) signupData.get("gender"));
            
            // Parse dateOfBirth
            String dateOfBirthStr = (String) signupData.get("dateOfBirth");
            if (dateOfBirthStr != null) {
                user.setDateOfBirth(java.time.LocalDate.parse(dateOfBirthStr));
            }
            
            user.setStudentId((String) signupData.get("studentId"));
            user.setTeacherId((String) signupData.get("teacherId"));
            user.setEmailVerified(true);
            
            // Set role based on signup data
            String role = (String) signupData.get("role");
            log.info("Signup data received - role value: '{}', role type: {}", role, role != null ? role.getClass().getName() : "null");
            if ("TEACHER".equals(role)) {
                user.setRole(Role.TEACHER);
                log.info("Setting user role to TEACHER");
            } else {
                user.setRole(Role.STUDENT); // Default to student
                log.info("Setting user role to STUDENT (role was: {})", role);
            }
            
            // Set school
            Long schoolId = ((Number) signupData.get("schoolId")).longValue();
            Optional<School> school = schoolRepository.findById(schoolId);
            school.ifPresent(user::setSchool);
            
            // Set department
            Long departmentId = ((Number) signupData.get("departmentId")).longValue();
            Optional<Department> department = departmentRepository.findById(departmentId);
            department.ifPresent(user::setDepartment);
            
            User savedUser = userRepository.save(user);
            
            // Xóa verification token sau khi xác minh thành công
            verificationTokenRepository.delete(verificationToken);
            
            log.info("User created and verified: {}", email);
            return savedUser;
        } catch (Exception e) {
            log.error("Error verifying token and creating user", e);
            throw new RuntimeException("Error processing verification", e);
        }
    }
    
    /**
     * Gửi lại verification token
     */
    public void resendVerificationToken(String email) {
        Optional<VerificationToken> existingToken = verificationTokenRepository.findLatestByEmail(email);
        
        if (existingToken.isEmpty()) {
            throw new IllegalArgumentException("No verification token found for this email");
        }
        
        VerificationToken token = existingToken.get();
        
        // Tạo token mới
        String newToken = generateVerificationToken();
        token.setToken(newToken);
        token.setCreatedAt(LocalDateTime.now());
        token.setExpiresAt(LocalDateTime.now().plusMinutes(TOKEN_EXPIRY_MINUTES));
        token.setAttempts(0); // Reset attempts
        
        verificationTokenRepository.save(token);
        
        // Gửi email
        emailService.sendVerificationEmail(email, newToken);
        log.info("Verification token resent to: {}", email);
    }
    
    /**
     * Tạo random verification token (6 ký tự)
     */
    private String generateVerificationToken() {
        Random random = new Random();
        StringBuilder token = new StringBuilder();
        for (int i = 0; i < 6; i++) {
            token.append(ALLOWED_CHARS.charAt(random.nextInt(ALLOWED_CHARS.length())));
        }
        return token.toString();
    }
}
