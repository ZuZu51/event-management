package com.example.event_management.security.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.event_management.User.dto.*;
import com.example.event_management.User.repository.UserRepository;
import com.example.event_management.User.repository.SchoolRepository;
import com.example.event_management.User.repository.DepartmentRepository;
import com.example.event_management.security.service.VerificationService;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.entity.School;
import com.example.event_management.User.entity.Department;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class VerificationController {
    
    private final VerificationService verificationService;
    private final UserRepository userRepository;
    private final SchoolRepository schoolRepository;
    private final DepartmentRepository departmentRepository;
    private final ObjectMapper objectMapper;
    
    /**
     * Kiểm tra tài khoản có tồn tại
     */
    @PostMapping("/check-account")
    public ResponseEntity<CheckAccountResponse> checkAccount(@RequestBody CheckAccountRequest request) {
        try {
            boolean exists = verificationService.accountExists(request.getEmail());
            CheckAccountResponse response = new CheckAccountResponse();
            response.setExists(exists);
            response.setRequiresCompletion(!exists); // Cần hoàn thành signup nếu chưa tồn tại
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error checking account", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Hoàn thành signup - lưu thông tin và gửi email xác minh
     */
    @PostMapping("/complete-signup")
    public ResponseEntity<Map<String, Object>> completeSignup(@RequestBody CompleteSignupRequest request) {
        try {
            // Kiểm tra email đã tồn tại
            if (verificationService.accountExists(request.getEmail())) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Email already exists");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            // Kiểm tra các trường bắt buộc
            if (request.getFullName() == null || request.getFullName().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Full name is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            if (request.getDateOfBirth() == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Date of birth is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }
            
            // Convert request to JSON để lưu tạm thời
            String signupDataJson = objectMapper.writeValueAsString(request);
            
            // Tạo verification token và gửi email
            verificationService.createAndSendVerificationToken(request.getEmail(), signupDataJson);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Verification code sent to email");
            response.put("email", request.getEmail());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error completing signup", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Xác minh email
     */
    @PostMapping("/verify-email")
    public ResponseEntity<Map<String, Object>> verifyEmail(@RequestBody VerifyEmailRequest request) {
        try {
            User user = verificationService.verifyTokenAndCreateUser(request.getEmail(), request.getToken());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Email verified successfully");
            response.put("userId", user.getId());
            response.put("email", user.getEmail());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Invalid verification attempt: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error verifying email", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Gửi lại mã xác minh
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<Map<String, Object>> resendVerification(@RequestBody ResendVerificationRequest request) {
        try {
            verificationService.resendVerificationToken(request.getEmail());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Verification code resent");
            response.put("email", request.getEmail());
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Resend verification error: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        } catch (Exception e) {
            log.error("Error resending verification", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Lấy danh sách các trường
     */
    @GetMapping("/schools")
    public ResponseEntity<List<SchoolDTO>> getSchools() {
        try {
            List<SchoolDTO> schools = schoolRepository.findByActiveTrue()
                .stream()
                .map(school -> new SchoolDTO(
                    school.getId(),
                    school.getName(),
                    school.getCode(),
                    school.getCity()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(schools);
        } catch (Exception e) {
            log.error("Error fetching schools", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Lấy danh sách khoa theo trường
     */
    @GetMapping("/departments")
    public ResponseEntity<List<DepartmentDTO>> getDepartments(@RequestParam Long schoolId) {
        try {
            List<DepartmentDTO> departments = departmentRepository.findBySchoolIdAndActiveTrue(schoolId)
                .stream()
                .map(dept -> new DepartmentDTO(
                    dept.getId(),
                    dept.getName(),
                    dept.getCode(),
                    dept.getSchool().getId()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(departments);
        } catch (Exception e) {
            log.error("Error fetching departments", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
