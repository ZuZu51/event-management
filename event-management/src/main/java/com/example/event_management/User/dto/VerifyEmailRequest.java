package com.example.event_management.User.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VerifyEmailRequest {
    @JsonProperty("email")
    private String email;
    
    @JsonProperty("token")
    private String token;
}
