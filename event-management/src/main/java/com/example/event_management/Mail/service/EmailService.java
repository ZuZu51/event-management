package com.example.event_management.Mail.service;

import jakarta.mail.MessagingException;
import org.springframework.mail.MailException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender emailSender;

    /**
     * Gửi email HTML kèm ảnh inline (chạy bất đồng bộ)
     *
     * @param to        người nhận
     * @param subject   tiêu đề
     * @param htmlBody  nội dung HTML (sử dụng <img src='cid:IMAGE_ID'> để hiển thị ảnh)
     * @param imageBytes mảng byte ảnh (PNG, JPG,...)
     * @param imageId   id để dùng trong htmlBody
     */
    @Async
    public void sendHtmlMessageWithImage(String to, String subject, String htmlBody,
                                         byte[] imageBytes, String imageId) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = nội dung HTML

            if (imageBytes != null && imageId != null) {
                helper.addInline(imageId, new ByteArrayResource(imageBytes), "image/png");
            }

            emailSender.send(message);
            System.out.println("✅ Email gửi thành công tới: " + to);
        } catch (MessagingException e) {
            e.printStackTrace();
            System.err.println("❌ Lỗi khi gửi email (MessagingException) tới " + to + ": " + e.getMessage());
        } catch (MailException me) {
            // Spring Mail exceptions (SMTP connection, auth, etc.) are runtime
            me.printStackTrace();
            System.err.println("❌ Lỗi khi gửi email (MailException) tới " + to + ": " + me.getMessage());
        } catch (Exception ex) {
            ex.printStackTrace();
            System.err.println("❌ Lỗi không xác định khi gửi email tới " + to + ": " + ex.getMessage());
        }
    }

    /**
     * Gửi email xác minh tài khoản
     */
    @Async
    public void sendVerificationEmail(String toEmail, String verificationCode) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Xác minh tài khoản Event Management");

            String htmlContent = buildVerificationEmailHtml(verificationCode);
            helper.setText(htmlContent, true);

            emailSender.send(message);
            System.out.println("✅ Verification email sent to: " + toEmail);
        } catch (MessagingException e) {
            e.printStackTrace();
            System.err.println("❌ Failed to send verification email to: " + toEmail);
        }
    }

    /**
     * Tạo HTML content cho email xác minh
     */
    private String buildVerificationEmailHtml(String verificationCode) {
        return "<!DOCTYPE html>" +
                "<html lang=\"vi\">" +
                "<head>" +
                "    <meta charset=\"UTF-8\">" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "    <style>" +
                "        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f7fa; margin: 0; padding: 0; }" +
                "        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden; }" +
                "        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }" +
                "        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }" +
                "        .content { padding: 30px; }" +
                "        .content p { color: #4a5f6f; font-size: 16px; line-height: 1.6; margin: 10px 0; }" +
                "        .code-box { background: #f5f7fa; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; text-align: center; }" +
                "        .code-box .label { color: #6b7a82; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; }" +
                "        .code-box .code { font-size: 28px; font-weight: 700; letter-spacing: 2px; color: #667eea; font-family: 'Courier New', monospace; }" +
                "        .footer { background: #f5f7fa; padding: 20px; text-align: center; color: #6b7a82; font-size: 12px; }" +
                "        ul { color: #4a5f6f; }" +
                "        li { margin: 8px 0; }" +
                "    </style>" +
                "</head>" +
                "<body>" +
                "    <div class=\"container\">" +
                "        <div class=\"header\">" +
                "            <h1>Xác Minh Tài Khoản</h1>" +
                "        </div>" +
                "        <div class=\"content\">" +
                "            <p>Xin chào,</p>" +
                "            <p>Cảm ơn bạn đã đăng ký tài khoản Event Management. Vui lòng sử dụng mã xác minh dưới đây để hoàn tất quá trình đăng ký.</p>" +
                "            <div class=\"code-box\">" +
                "                <div class=\"label\">Mã Xác Minh (hết hạn trong 5 phút)</div>" +
                "                <div class=\"code\">" + verificationCode + "</div>" +
                "            </div>" +
                "            <p><strong>Lưu ý:</strong></p>" +
                "            <ul>" +
                "                <li>Mã xác minh chỉ có hiệu lực trong 5 phút</li>" +
                "                <li>Nếu không phải bạn yêu cầu, vui lòng bỏ qua email này</li>" +
                "                <li>Không chia sẻ mã này cho bất kỳ ai</li>" +
                "            </ul>" +
                "            <p style=\"margin-top: 30px; padding-top: 20px; border-top: 1px solid #e6eefc; color: #6b7a82; font-size: 14px;\">" +
                "                Nếu bạn không nhận được email trong mục chính, vui lòng kiểm tra trong mục <strong>Spam</strong> hoặc <strong>Thư rác</strong>." +
                "            </p>" +
                "        </div>" +
                "        <div class=\"footer\">" +
                "            <p>&copy; 2025 Event Management. All rights reserved.</p>" +
                "            <p>Email này được gửi tự động, vui lòng không trả lời.</p>" +
                "        </div>" +
                "    </div>" +
                "</body>" +
                "</html>";
    }}
