package com.example.event_management.media;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public Map uploadFromUrl(String imageUrl) {
        Map params = ObjectUtils.asMap(
                "use_filename", true,
                "unique_filename", true,
                "overwrite", false
        );

        try {
            Map result = cloudinary.uploader().upload(imageUrl, params);
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Cloudinary upload failed: " + e.getMessage(), e);
        }
    }

    public Map uploadFromMultipart(MultipartFile file) {
        Map params = ObjectUtils.asMap(
                "use_filename", true,
                "unique_filename", true,
                "overwrite", false
        );

        try {
            Map result = cloudinary.uploader().upload(file.getBytes(), params);
            return result;
        } catch (IOException e) {
            throw new RuntimeException("Failed to read multipart file: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Cloudinary upload failed: " + e.getMessage(), e);
        }
    }

    /**
     * Generate a transformed url for a given public id with specified width/height using fill crop.
     */
    public String generateTransformedUrl(String publicId, int width, int height) {
        try {
            com.cloudinary.Transformation t = new com.cloudinary.Transformation()
                    .width(width)
                    .height(height)
                    .crop("fill")
                    .fetchFormat("auto")
                    .quality("auto");

            return cloudinary.url().transformation(t).generate(publicId);
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate transformed url: " + e.getMessage(), e);
        }
    }
}
