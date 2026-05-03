package com.example.event_management.Event.controller;

import com.example.event_management.Event.entity.EventResource;
import com.example.event_management.Event.service.EventResourceService;
import com.example.event_management.User.entity.User;
import com.example.event_management.User.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/events/{eventId}/resources")
@Slf4j
public class EventResourceController {

    private final EventResourceService resourceService;
    private final UserRepository userRepository;

    public EventResourceController(EventResourceService resourceService, UserRepository userRepository) {
        this.resourceService = resourceService;
        this.userRepository = userRepository;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> uploadResource(
            @PathVariable Long eventId,
            @RequestParam("files") MultipartFile[] files,
            Authentication authentication) {
        try {
            log.info("📤 Received upload request - eventId: {}, fileCount: {}", 
                eventId, files.length);
            
            Long userId = extractUserId(authentication);
            List<EventResource> resources = new ArrayList<>();
            
            for (MultipartFile file : files) {
                log.info("Processing file: {}, size: {}", file.getOriginalFilename(), file.getSize());
                try {
                    EventResource resource = resourceService.uploadResource(eventId, userId, file);
                    resources.add(resource);
                } catch (Exception e) {
                    log.warn("Failed to upload file {}: {}", file.getOriginalFilename(), e.getMessage());
                }
            }

            if (resources.isEmpty()) {
                throw new IllegalArgumentException("Không có file nào được upload thành công");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", resources);
            response.put("message", "Upload " + resources.size() + " file thành công");

            log.info("✅ Upload successful - uploaded {} files", resources.size());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("⚠️ Validation error: {}", e.getMessage());
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("❌ Unexpected error during upload", e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Lỗi server: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }


    @GetMapping
    public ResponseEntity<Map<String, Object>> getEventResources(@PathVariable Long eventId) {
        try {
            List<EventResource> resources = resourceService.getEventResources(eventId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", resources);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Lỗi khi lấy danh sách resources");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/{resourceId}/download")
    public ResponseEntity<?> downloadFile(
            @PathVariable Long eventId,
            @PathVariable Long resourceId) {
        try {
            byte[] fileContent = resourceService.downloadFile(resourceId);
            String originalFileName = resourceService.getOriginalFileName(resourceId);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + originalFileName + "\"")
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .body(fileContent);
        } catch (IOException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Lỗi download file");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @DeleteMapping("/{resourceId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> deleteResource(
            @PathVariable Long eventId,
            @PathVariable Long resourceId) {
        try {
            resourceService.deleteResource(resourceId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa file thành công");

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    private Long extractUserId(Authentication authentication) {
        if (authentication == null) {
            throw new RuntimeException("Không được xác thực");
        }

        String name = authentication.getName();
        
        try {
            return Long.parseLong(name);
        } catch (NumberFormatException e) {
            User user = userRepository.findByEmail(name)
                    .orElseThrow(() -> new RuntimeException("User không tìm thấy"));
            return user.getId();
        }
    }
}
