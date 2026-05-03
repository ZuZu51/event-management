package com.example.event_management.User.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CompleteSignupRequest {
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("fullName")
    private String fullName;
    
    @JsonProperty("dateOfBirth")
    private LocalDate dateOfBirth;
    
    @JsonProperty("gender")
    private String gender;  // Nam / Nữ / Khác
    
    @JsonProperty("schoolId")
    private Long schoolId;
    
    @JsonProperty("studentId")
    private String studentId;
    
    @JsonProperty("teacherId")
    private String teacherId;
    
    @JsonProperty("departmentId")
    private Long departmentId;
    
    @JsonProperty("role")
    private String role;  // STUDENT or TEACHER
}
