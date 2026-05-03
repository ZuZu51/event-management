package com.example.event_management.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import jakarta.annotation.PostConstruct;

@Slf4j
@Configuration
@Getter
public class VNPayConfig {

    @Value("${vnpay.tmn-code}")
    private String tmnCode;

    @Value("${vnpay.hash-secret}")
    private String hashSecret;

    @Value("${vnpay.pay-url}")
    private String payUrl;

    @Value("${vnpay.return-url}")
    private String returnUrl;

    @PostConstruct
    public void init() {
        log.info("=== VNPay Config Loaded ===");
        log.info("TMN Code: {}", tmnCode);
        log.info("Hash Secret: {}...", hashSecret.substring(0, 10));
        log.info("Pay URL: {}", payUrl);
        log.info("Return URL: {}", returnUrl);
        log.info("===========================");
    }

    public String getTmnCode() {
        return tmnCode != null ? tmnCode.trim() : null;
    }

    public String getHashSecret() {
        return hashSecret != null ? hashSecret.trim() : null;
    }
}