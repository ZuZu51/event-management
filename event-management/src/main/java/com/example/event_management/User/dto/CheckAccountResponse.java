package com.example.event_management.User.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CheckAccountResponse {
    @JsonProperty("exists")
    private Boolean exists;
    
    @JsonProperty("requiresCompletion")
    private Boolean requiresCompletion;
}
