package com.example.event_management.Geocoding.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.event_management.Geocoding.service.TrackAsiaGeocodingService;
import lombok.Data;

@RestController
@RequestMapping("/api/geocode")
@RequiredArgsConstructor
@Slf4j
public class GeocodingController {

    private final TrackAsiaGeocodingService trackAsiaService;

    /**
     * Convert address to coordinates
     */
    @PostMapping
    public ResponseEntity<?> geocodeAddress(@RequestBody GeocodeRequest request) {
        try {
            log.info("📍 Geocoding request: {}", request.getAddress());

            TrackAsiaGeocodingService.GeocodeResult result = trackAsiaService.geocodeAddress(request.getAddress());

            return ResponseEntity.ok(new GeocodeResponse(
                result.getLatitude(),
                result.getLongitude(),
                result.getAddress()
            ));
        } catch (Exception e) {
            log.error("❌ Geocoding error: {}", e.getMessage());
            return ResponseEntity.badRequest().body(new ErrorResponse("Không thể lấy tọa độ: " + e.getMessage()));
        }
    }

    @Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GeocodeRequest {
        private String address;
    }

    @Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GeocodeResponse {
        private Double latitude;
        private Double longitude;
        private String address;
    }

    @Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class ErrorResponse {
        private String error;
    }
}
