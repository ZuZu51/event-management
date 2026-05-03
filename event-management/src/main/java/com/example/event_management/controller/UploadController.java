package com.example.event_management.controller;

import com.example.event_management.media.CloudinaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/upload")
@RequiredArgsConstructor
public class UploadController {

    private final CloudinaryService cloudinaryService;

    // Upload từ URL
    @PostMapping("/test")
    public ResponseEntity<?> uploadTest(@RequestParam String imageUrl) {
        Map result = cloudinaryService.uploadFromUrl(imageUrl);
        Object secureUrl = result.get("secure_url");
        Object url = result.get("url");
        Object publicId = result.get("public_id");
        // build response and include a 413x160 thumbnail if possible
        String thumb413 = null;
        if (publicId != null) {
            thumb413 = cloudinaryService.generateTransformedUrl(publicId.toString(), 413, 160);
        }

        return ResponseEntity.ok(Map.of(
                "url", secureUrl != null ? secureUrl : url,
                "public_id", publicId,
                "thumbnail_413x160", thumb413,
                "raw", result
        ));
    }

    // Upload file từ form-data
    @PostMapping("/file")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        Map result = cloudinaryService.uploadFromMultipart(file);

        // Extract common fields
        Object secureUrl = result.get("secure_url");
        Object url = result.get("url");
        Object publicId = result.get("public_id");

        String thumb413 = null;
        if (publicId != null) {
            thumb413 = cloudinaryService.generateTransformedUrl(publicId.toString(), 413, 160);
        }

        return ResponseEntity.ok(Map.of(
                "url", secureUrl != null ? secureUrl : url,
                "public_id", publicId,
                "thumbnail_413x160", thumb413,
                "raw", result
        ));
    }
}
