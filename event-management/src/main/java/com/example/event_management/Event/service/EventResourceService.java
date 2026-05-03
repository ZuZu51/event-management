package com.example.event_management.Event.service;

import com.example.event_management.Event.entity.EventResource;
import com.example.event_management.Event.repository.EventResourceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class EventResourceService {

    private final EventResourceRepository repository;
    
    @Value("${file.upload-dir:uploads}")
    private String uploadDirConfig;
    
    private Path getAbsoluteUploadDir() {
        Path uploadPath;
        if (uploadDirConfig.startsWith("/") || uploadDirConfig.matches("^[A-Za-z]:.*")) {
            // Absolute path
            uploadPath = Paths.get(uploadDirConfig);
        } else {
            // Relative path - resolve from user home
            uploadPath = Paths.get(System.getProperty("user.home"), uploadDirConfig);
        }
        return uploadPath;
    }

    private static final List<String> ALLOWED_TYPES = List.of("pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx");
    private static final long MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

    public EventResourceService(EventResourceRepository repository) {
        this.repository = repository;
    }

    public EventResource uploadResource(Long eventId, Long uploadedBy, MultipartFile file) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File không được rỗng");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Kích thước file vượt quá 100MB");
        }

        String fileExtension = getFileExtension(file.getOriginalFilename());
        log.info("📦 File extension: {}", fileExtension);
        
        if (!ALLOWED_TYPES.contains(fileExtension.toLowerCase())) {
            throw new IllegalArgumentException("Loại file không được phép: " + fileExtension);
        }

        // Get absolute upload directory
        Path baseUploadDir = getAbsoluteUploadDir();
        Path eventDir = baseUploadDir.resolve("events").resolve(eventId.toString());
        
        log.info("📂 Absolute upload directory: {}", baseUploadDir.toAbsolutePath());
        log.info("📂 Event directory: {}", eventDir.toAbsolutePath());
        
        // Create directory structure - MUST happen before file transfer
        try {
            Files.createDirectories(eventDir);
            log.info("✅ Directory ready: {}", eventDir.toAbsolutePath());
        } catch (Exception e) {
            log.error("❌ Failed to create directory: {} - {}", eventDir.toAbsolutePath(), e.getMessage(), e);
            throw new IOException("Không thể tạo thư mục upload: " + e.getMessage(), e);
        }

        // Generate unique filename
        String fileName = UUID.randomUUID() + "." + fileExtension;
        Path filePath = eventDir.resolve(fileName);
        
        log.info("📝 Transferring file to: {}", filePath.toAbsolutePath());

        // Transfer file to disk
        try {
            // Create parent directory one more time to be safe
            Files.createDirectories(filePath.getParent());
            
            file.transferTo(filePath);
            
            log.info("✅ File uploaded successfully: {} (size: {} bytes)", filePath.toAbsolutePath(), file.getSize());
        } catch (IOException e) {
            log.error("❌ Failed to transfer file to: {} - {}", filePath.toAbsolutePath(), e.getMessage(), e);
            throw new IOException("Lỗi upload file: " + e.getMessage(), e);
        }

        // Save metadata to database
        try {
            EventResource resource = EventResource.builder()
                    .eventId(eventId)
                    .uploadedBy(uploadedBy)
                    .fileName(file.getOriginalFilename())
                    .filePath(filePath.toAbsolutePath().toString())
                    .fileSize(file.getSize())
                    .fileType(fileExtension)
                    .isDeleted(false)
                    .build();

            EventResource saved = repository.save(resource);
            log.info("✅ Metadata saved: id={}, fileName={}", saved.getId(), saved.getFileName());
            return saved;
        } catch (Exception e) {
            // Delete the file if DB save fails
            try {
                Files.deleteIfExists(filePath);
                log.warn("Deleted file due to DB save failure: {}", filePath.toAbsolutePath());
            } catch (IOException deleteError) {
                log.error("Failed to cleanup file after DB error: {}", filePath.toAbsolutePath(), deleteError);
            }
            log.error("❌ Failed to save metadata: {}", e.getMessage(), e);
            throw new IOException("Lỗi lưu metadata file: " + e.getMessage(), e);
        }
    }

    public List<EventResource> getEventResources(Long eventId) {
        return repository.findByEventIdAndNotDeleted(eventId);
    }

    public byte[] downloadFile(Long resourceId) throws IOException {
        EventResource resource = repository.findByIdAndNotDeleted(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource không tìm thấy"));

        File file = new File(resource.getFilePath());
        if (!file.exists()) {
            throw new RuntimeException("File không tồn tại");
        }

        return Files.readAllBytes(file.toPath());
    }

    public String getOriginalFileName(Long resourceId) {
        EventResource resource = repository.findByIdAndNotDeleted(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource không tìm thấy"));
        return resource.getFileName();
    }

    public void deleteResource(Long resourceId) {
        EventResource resource = repository.findByIdAndNotDeleted(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource không tìm thấy"));

        // Xóa file từ server
        try {
            File file = new File(resource.getFilePath());
            if (file.exists()) {
                if (file.delete()) {
                    log.info("✅ Deleted file: {}", resource.getFilePath());
                } else {
                    log.warn("⚠️ Failed to delete file: {}", resource.getFilePath());
                }
            }
        } catch (Exception e) {
            log.error("❌ Error deleting file", e);
        }

        // Soft delete metadata
        resource.setIsDeleted(true);
        repository.save(resource);
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }
}
