package com.example.event_management.admin.controller;

import com.example.event_management.User.entity.School;
import com.example.event_management.User.entity.Department;
import com.example.event_management.User.repository.SchoolRepository;
import com.example.event_management.User.repository.DepartmentRepository;
import com.example.event_management.User.dto.SchoolDTO;
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
 * Admin School & Department Management Controller
 * Handles CRUD operations for schools and departments
 */
@RestController
@RequestMapping("/admin/schools")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AdminSchoolController {

    private final SchoolRepository schoolRepository;
    private final DepartmentRepository departmentRepository;

    // ==================== SCHOOL MANAGEMENT ====================

    /**
     * GET /admin/schools - Get all schools
     */
    @GetMapping
    public ResponseEntity<List<SchoolDTO>> getAllSchools() {
        try {
            List<SchoolDTO> schools = schoolRepository.findAll().stream()
                    .map(s -> SchoolDTO.builder()
                            .id(s.getId())
                            .name(s.getName())
                            .build())
                    .collect(Collectors.toList());
            return ResponseEntity.ok(schools);
        } catch (Exception e) {
            log.error("Error getting all schools", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /admin/schools/active - Get all active schools
     */
    @GetMapping("/active")
    public ResponseEntity<List<SchoolDTO>> getActiveSchools() {
        try {
            List<SchoolDTO> schools = schoolRepository.findByActiveTrue().stream()
                    .map(s -> SchoolDTO.builder()
                            .id(s.getId())
                            .name(s.getName())
                            .build())
                    .collect(Collectors.toList());
            return ResponseEntity.ok(schools);
        } catch (Exception e) {
            log.error("Error getting active schools", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * GET /admin/schools/{schoolId} - Get school by ID
     */
    @GetMapping("/{schoolId}")
    public ResponseEntity<SchoolDTO> getSchoolById(@PathVariable Long schoolId) {
        try {
            return schoolRepository.findById(schoolId)
                    .map(s -> ResponseEntity.ok(SchoolDTO.builder()
                            .id(s.getId())
                            .name(s.getName())
                            .build()))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting school by ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /admin/schools - Create new school
     */
    @PostMapping
    public ResponseEntity<Map<String, Object>> createSchool(@RequestBody SchoolDTO dto) {
        try {
            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Tên trường không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            School school = School.builder()
                    .name(dto.getName())
                    .code(generateSchoolCode(dto.getName()))
                    .city("")
                    .description("")
                    .active(true)
                    .build();

            School savedSchool = schoolRepository.save(school);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Thêm trường thành công");
            response.put("id", savedSchool.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (Exception e) {
            log.error("Error creating school", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi thêm trường");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * PUT /admin/schools/{schoolId} - Update school
     */
    @PutMapping("/{schoolId}")
    public ResponseEntity<Map<String, Object>> updateSchool(
            @PathVariable Long schoolId,
            @RequestBody SchoolDTO dto) {
        try {
            if (dto.getName() == null || dto.getName().trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Tên trường không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            return schoolRepository.findById(schoolId)
                    .map(school -> {
                        school.setName(dto.getName());
                        schoolRepository.save(school);

                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", "Cập nhật trường thành công");
                        return ResponseEntity.ok(response);
                    })
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error updating school", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi cập nhật trường");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * DELETE /admin/schools/{schoolId} - Delete school
     */
    @DeleteMapping("/{schoolId}")
    public ResponseEntity<Map<String, Object>> deleteSchool(@PathVariable Long schoolId) {
        try {
            if (!schoolRepository.existsById(schoolId)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Trường không tồn tại");
                return ResponseEntity.notFound().build();
            }

            schoolRepository.deleteById(schoolId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa trường thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting school", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi xóa trường");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ==================== DEPARTMENT MANAGEMENT ====================

    /**
     * GET /admin/schools/{schoolId}/departments - Get all departments by school
     */
    @GetMapping("/{schoolId}/departments")
    public ResponseEntity<List<Map<String, Object>>> getDepartmentsBySchool(@PathVariable Long schoolId) {
        try {
            List<Map<String, Object>> departments = departmentRepository.findBySchoolIdAndActiveTrue(schoolId)
                    .stream()
                    .map(d -> {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", d.getId());
                        map.put("name", d.getName());
                        map.put("schoolId", d.getSchool().getId());
                        return map;
                    })
                    .collect(Collectors.toList());
            return ResponseEntity.ok(departments);
        } catch (Exception e) {
            log.error("Error getting departments by school", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * POST /admin/schools/{schoolId}/departments - Create new department
     */
    @PostMapping("/{schoolId}/departments")
    public ResponseEntity<Map<String, Object>> createDepartment(
            @PathVariable Long schoolId,
            @RequestBody Map<String, String> request) {
        try {
            String deptName = request.get("name");
            if (deptName == null || deptName.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Tên khoa không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            return schoolRepository.findById(schoolId)
                    .map(school -> {
                        Department department = Department.builder()
                                .name(deptName)
                                .code(generateDeptCode(deptName))
                                .school(school)
                                .description("")
                                .active(true)
                                .build();

                        Department savedDept = departmentRepository.save(department);

                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", "Thêm khoa thành công");
                        response.put("id", savedDept.getId());
                        return ResponseEntity.status(HttpStatus.CREATED).body(response);
                    })
                    .orElseGet(() -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", false);
                        response.put("message", "Trường không tồn tại");
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("Error creating department", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi thêm khoa");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * PUT /admin/schools/{schoolId}/departments/{deptId} - Update department
     */
    @PutMapping("/{schoolId}/departments/{deptId}")
    public ResponseEntity<Map<String, Object>> updateDepartment(
            @PathVariable Long schoolId,
            @PathVariable Long deptId,
            @RequestBody Map<String, String> request) {
        try {
            String deptName = request.get("name");
            if (deptName == null || deptName.trim().isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Tên khoa không được trống");
                return ResponseEntity.badRequest().body(response);
            }

            return departmentRepository.findById(deptId)
                    .map(dept -> {
                        dept.setName(deptName);
                        departmentRepository.save(dept);

                        Map<String, Object> response = new HashMap<>();
                        response.put("success", true);
                        response.put("message", "Cập nhật khoa thành công");
                        return ResponseEntity.ok(response);
                    })
                    .orElseGet(() -> {
                        Map<String, Object> response = new HashMap<>();
                        response.put("success", false);
                        response.put("message", "Khoa không tồn tại");
                        return ResponseEntity.notFound().build();
                    });
        } catch (Exception e) {
            log.error("Error updating department", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi cập nhật khoa");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    /**
     * DELETE /admin/schools/{schoolId}/departments/{deptId} - Delete department
     */
    @DeleteMapping("/{schoolId}/departments/{deptId}")
    public ResponseEntity<Map<String, Object>> deleteDepartment(
            @PathVariable Long schoolId,
            @PathVariable Long deptId) {
        try {
            if (!departmentRepository.existsById(deptId)) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "Khoa không tồn tại");
                return ResponseEntity.notFound().build();
            }

            departmentRepository.deleteById(deptId);

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Xóa khoa thành công");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting department", e);
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Lỗi khi xóa khoa");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // ==================== HELPER METHODS ====================

    private String generateSchoolCode(String schoolName) {
        // Generate unique code: SCHOOLNAME_TIMESTAMP
        String baseName = schoolName.replaceAll("\\s+", "").substring(0, Math.min(10, schoolName.length())).toUpperCase();
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(String.valueOf(System.currentTimeMillis()).length() - 6);
        return baseName + "_" + timestamp;
    }

    private String generateDeptCode(String deptName) {
        // Generate unique code: DEPTNAME_TIMESTAMP
        String baseName = deptName.replaceAll("\\s+", "").substring(0, Math.min(10, deptName.length())).toUpperCase();
        String timestamp = String.valueOf(System.currentTimeMillis()).substring(String.valueOf(System.currentTimeMillis()).length() - 6);
        return baseName + "_" + timestamp;
    }
}
