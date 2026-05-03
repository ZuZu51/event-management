package com.example.event_management.admin.controller;

import com.example.event_management.Event.entity.EventCategory;
import com.example.event_management.Event.repository.EventCategoryRepository;
import com.example.event_management.Event.dto.EventCategoryDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Admin Event Category Management Controller
 * Handles CRUD operations for event categories
 */
@RestController
@RequestMapping("/admin/categories")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AdminCategoryController {

    private final EventCategoryRepository categoryRepository;

    /**
     * GET /admin/categories - Get all categories
     */
    @GetMapping
    public ResponseEntity<List<EventCategoryDTO>> getAllCategories() {
        try {
            List<EventCategoryDTO> categories = categoryRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Error getting all categories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /admin/categories/active - Get all active categories
     */
    @GetMapping("/active")
    public ResponseEntity<List<EventCategoryDTO>> getActiveCategories() {
        try {
            List<EventCategoryDTO> categories = categoryRepository.findByActiveTrue().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(categories);
        } catch (Exception e) {
            log.error("Error getting active categories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /admin/categories/{categoryId} - Get category by ID
     */
    @GetMapping("/{categoryId}")
    public ResponseEntity<EventCategoryDTO> getCategoryById(@PathVariable Long categoryId) {
        try {
            return categoryRepository.findById(categoryId)
                    .map(cat -> ResponseEntity.ok(convertToDTO(cat)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting category by ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /admin/categories - Create new category
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createCategory(@RequestBody EventCategoryDTO dto) {
        try {
            // Validate
            if (dto.getLabel() == null || dto.getLabel().trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Tên danh mục không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            if (dto.getValue() == null || dto.getValue().trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Mã danh mục không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            // Check if value already exists
            if (categoryRepository.existsByValue(dto.getValue())) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Mã danh mục đã tồn tại");
                return ResponseEntity.badRequest().body(response);
            }

            EventCategory category = EventCategory.builder()
                    .label(dto.getLabel())
                    .value(dto.getValue().toUpperCase())
                    .active(dto.getActive() != null ? dto.getActive() : true)
                    .build();

            EventCategory savedCategory = categoryRepository.save(category);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Thêm danh mục thành công");
            response.put("id", savedCategory.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error creating category", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi thêm danh mục");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * PUT /admin/categories/{categoryId} - Update category
     */
    @PutMapping("/{categoryId}")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @PathVariable Long categoryId,
            @RequestBody EventCategoryDTO dto) {
        try {
            // Validate
            if (dto.getLabel() == null || dto.getLabel().trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Tên danh mục không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            if (dto.getValue() == null || dto.getValue().trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Mã danh mục không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            return categoryRepository.findById(categoryId)
                    .map(category -> {
                        category.setLabel(dto.getLabel());
                        category.setValue(dto.getValue().toUpperCase());
                        if (dto.getActive() != null) {
                            category.setActive(dto.getActive());
                        }
                        categoryRepository.save(category);

                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", "Cập nhật danh mục thành công");
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", false);
                        response.put("message", "Danh mục không tồn tại");
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("Error updating category", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi cập nhật danh mục");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * DELETE /admin/categories/{categoryId} - Delete category
     */
    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Map<String, Object>> deleteCategory(@PathVariable Long categoryId) {
        try {
            if (!categoryRepository.existsById(categoryId)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Danh mục không tồn tại");
                return ResponseEntity.notFound().build();
            }

            categoryRepository.deleteById(categoryId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa danh mục thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting category", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi xóa danh mục");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * PUT /admin/categories/{categoryId}/toggle-active - Toggle category status
     */
    @PutMapping("/{categoryId}/toggle-active")
    public ResponseEntity<Map<String, Object>> toggleCategoryStatus(@PathVariable Long categoryId) {
        try {
            return categoryRepository.findById(categoryId)
                    .map(category -> {
                        category.setActive(!category.getActive());
                        categoryRepository.save(category);

                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", category.getActive() ? "Kích hoạt danh mục thành công" : "Vô hiệu hóa danh mục thành công");
                        response.put("active", category.getActive());
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", false);
                        response.put("message", "Danh mục không tồn tại");
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("Error toggling category status", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi thay đổi trạng thái danh mục");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    private EventCategoryDTO convertToDTO(EventCategory category) {
        return EventCategoryDTO.builder()
                .id(category.getId())
                .label(category.getLabel())
                .value(category.getValue())
                .active(category.getActive())
                .build();
    }
}
