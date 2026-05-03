package com.example.event_management.Event.controller;

import com.example.event_management.Ticket.service.TicketService;
import com.example.event_management.configuration.VNPayConfig;
import com.example.event_management.utils.VNPayUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;

@Slf4j
@RestController
@RequestMapping("/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final VNPayConfig vnpayConfig;
    private final TicketService ticketService;

    @PostMapping
    public Map<String, Object> createPayment(
            @RequestParam("amount") int amount,
            @RequestParam("trackingCode") String trackingCode,
            @RequestParam("userId") Long userId,
            HttpServletRequest request
    ) {

        try {
            String vnp_Version = "2.1.0";
            String vnp_Command = "pay";
            String orderType = "other";
            long vnp_Amount = amount * 100L;
            String vnp_TxnRef = trackingCode;
            String vnp_IpAddr = VNPayUtil.getIpAddress(request);

            // Convert IPv6 localhost to IPv4
            if ("0:0:0:0:0:0:0:1".equals(vnp_IpAddr) || "::1".equals(vnp_IpAddr)) {
                vnp_IpAddr = "127.0.0.1";
            }

            String vnp_TmnCode = vnpayConfig.getTmnCode();

            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnp_Version);
            vnp_Params.put("vnp_Command", vnp_Command);
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(vnp_Amount));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_BankCode", "NCB");
            vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
            vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang:" + vnp_TxnRef);
            vnp_Params.put("vnp_OrderType", orderType);
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", vnpayConfig.getReturnUrl());
            vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

            Calendar cld = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            cld.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cld.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            // Build hash data và query - THEO CODE MẪU VNPAY
            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);

            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();

            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    // Build hash data - ENCODE với US_ASCII (theo code mẫu)
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));

                    // Build query - ENCODE với US_ASCII (theo code mẫu)
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));

                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }

            String queryUrl = query.toString();
            String vnp_SecureHash = VNPayUtil.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());
            queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
            String paymentUrl = vnpayConfig.getPayUrl() + "?" + queryUrl;

            log.info("Creating VNPay payment - TxnRef: {}, Amount: {}", vnp_TxnRef, vnp_Amount);
            log.info("Payment URL: {}", paymentUrl);

            Map<String, Object> result = new HashMap<>();
            result.put("code", "00");
            result.put("message", "success");
            result.put("data", paymentUrl);
            ticketService.createTicket(userId, Long.valueOf(trackingCode));
            return result;


        } catch (Exception e) {
            log.error("Error creating VNPay payment", e);
            Map<String, Object> result = new HashMap<>();
            result.put("code", "99");
            result.put("message", "Error: " + e.getMessage());
            return result;
        }
    }

    @GetMapping("/vnpay-return")
    public ResponseEntity<String> vnpayReturn(@RequestParam Map<String, String> params) {
        String vnp_SecureHash = params.get("vnp_SecureHash");
        params.remove("vnp_SecureHash");
        params.remove("vnp_SecureHashType");

        // Build hashData theo code mẫu VNPay
        List<String> fieldNames = new ArrayList<>(params.keySet());
        Collections.sort(fieldNames);

        StringBuilder hashData = new StringBuilder();
        Iterator<String> itr = fieldNames.iterator();
        while (itr.hasNext()) {
            String fieldName = itr.next();
            String fieldValue = params.get(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                hashData.append(fieldName);
                hashData.append('=');
                hashData.append(fieldValue);
                if (itr.hasNext()) {
                    hashData.append('&');
                }
            }
        }

        String calculatedHash = VNPayUtil.hmacSHA512(vnpayConfig.getHashSecret(), hashData.toString());

        log.info("VNPay Return - Received Hash: {}", vnp_SecureHash);
        log.info("VNPay Return - Calculated Hash: {}", calculatedHash);

        if (calculatedHash.equalsIgnoreCase(vnp_SecureHash)) {
            String responseCode = params.get("vnp_ResponseCode");
            if ("00".equals(responseCode)) {
                log.info("Payment successful - TxnRef: {}", params.get("vnp_TxnRef"));
                return ResponseEntity.ok("Thanh toán thành công!");
            } else {
                log.warn("Payment failed - TxnRef: {}, Code: {}", params.get("vnp_TxnRef"), responseCode);
                return ResponseEntity.ok("Thanh toán thất bại với mã: " + responseCode);
            }
        } else {
            log.error("Invalid checksum");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Sai checksum");
        }
    }
}