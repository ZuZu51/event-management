package com.example.event_management.Geocoding.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@Slf4j
public class TrackAsiaGeocodingService {

    @Value("${track-asia.api-key}")
    private String apiKey;

    private static final String SEARCH_URL = "https://maps.track-asia.com/api/v2/place/textsearch/json";
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Convert address to coordinates using Track-Asia Search API
     */
    public GeocodeResult geocodeAddress(String address) throws Exception {
        log.info("🔍 Geocoding address: {}", address);

        String url = String.format(
            "%s?query=%s&key=%s&language=vi",
            SEARCH_URL,
            java.net.URLEncoder.encode(address, java.nio.charset.StandardCharsets.UTF_8),
            apiKey
        );

        try {
            String response = restTemplate.getForObject(url, String.class);
            log.info("✅ Track-Asia response: {}", response);

            if (response != null) {
                com.fasterxml.jackson.databind.JsonNode root = objectMapper.readTree(response);
                com.fasterxml.jackson.databind.JsonNode results = root.get("results");

                if (results != null && results.size() > 0) {
                    com.fasterxml.jackson.databind.JsonNode firstResult = results.get(0);
                    com.fasterxml.jackson.databind.JsonNode geometry = firstResult.get("geometry");
                    com.fasterxml.jackson.databind.JsonNode location = geometry.get("location");

                    Double latitude = location.get("lat").asDouble();
                    Double longitude = location.get("lng").asDouble();
                    String formattedAddress = firstResult.get("formatted_address").asText();

                    log.info("✅ Extracted coordinates: lat={}, lon={}", latitude, longitude);

                    return new GeocodeResult(latitude, longitude, formattedAddress);
                }
            }

            throw new Exception("❌ No results found for address: " + address);
        } catch (Exception e) {
            log.error("❌ Error geocoding address: {}", address, e);
            throw e;
        }
    }

    /**
     * DTO for geocode result
     */
    @lombok.Data
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class GeocodeResult {
        private Double latitude;
        private Double longitude;
        private String address;
    }
}
