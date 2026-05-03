package com.example.event_management.User.controller;

import com.example.event_management.User.dto.UpdateUserInfoDTO;
import com.example.event_management.User.dto.UserDTO;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*") // Cho phép frontend truy cập API
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    // 🔹 Convert User entity to UserDTO
    private UserDTO convertToDTO(User user) {
        if (user == null) return null;
        
        UserDTO.SchoolSimpleDTO schoolDTO = null;
        if (user.getSchool() != null) {
            schoolDTO = UserDTO.SchoolSimpleDTO.builder()
                    .id(user.getSchool().getId())
                    .name(user.getSchool().getName())
                    .code(user.getSchool().getCode())
                    .city(user.getSchool().getCity())
                    .build();
        }
        
        UserDTO.DepartmentSimpleDTO departmentDTO = null;
        if (user.getDepartment() != null) {
            departmentDTO = UserDTO.DepartmentSimpleDTO.builder()
                    .id(user.getDepartment().getId())
                    .name(user.getDepartment().getName())
                    .code(user.getDepartment().getCode())
                    .schoolId(user.getDepartment().getSchool() != null ? user.getDepartment().getSchool().getId() : null)
                    .build();
        }
        
        return UserDTO.builder()
                .id(user.getId())
                .googleId(user.getGoogleId())
                .email(user.getEmail())
                .fullname(user.getFullName())
                .dateOfBirth(user.getDateOfBirth())
                .gender(user.getGender())
                .studentId(user.getStudentId())
                .teacherId(user.getTeacherId())
                .avatar(user.getAvatar())
                .school(schoolDTO)
                .department(departmentDTO)
                .role(user.getRole() != null ? user.getRole().toString() : null)
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    // 🔹 Lấy tất cả người dùng
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // 🔹 Lấy người dùng theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        return userService.getUserById(id)
                .map(user -> ResponseEntity.ok(convertToDTO(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Lấy người dùng theo Email
    @GetMapping("/email/{email}")
    public ResponseEntity<?> getUserByEmail(@PathVariable String email) {
        return userService.getUserByEmail(email)
                .map(user -> ResponseEntity.ok(convertToDTO(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Lấy người dùng theo Google ID
    @GetMapping("/google/{googleId}")
    public ResponseEntity<?> getUserByGoogleId(@PathVariable String googleId) {
        return userService.getUserByGoogleId(googleId)
                .map(user -> ResponseEntity.ok(convertToDTO(user)))
                .orElse(ResponseEntity.notFound().build());
    }

    // 🔹 Tạo mới user
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        User created = userService.createUser(user);
        return ResponseEntity.ok(created);
    }

    // 🔹 Cập nhật user
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserInfoDTO dto) {
        try {
            User updated = userService.updateUser(id, dto);
            return ResponseEntity.ok(convertToDTO(updated));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    // 🔹 Xóa user theo ID
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}
