package com.example.event_management.Event.excel;

import com.example.event_management.Event.dto.EventAttendeeDTO;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

public class ExcelExporter {

    public static byte[] exportAttendeesToExcel(String eventName, List<EventAttendeeDTO> attendees) throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Attendees");

            // =======================
            // 1️⃣ Hiển thị tên sự kiện ở dòng đầu
            // =======================
            Row eventNameRow = sheet.createRow(0);
            Cell eventNameCell = eventNameRow.createCell(0);
            eventNameCell.setCellValue("Danh sách sinh viên tham dự sự kiện: " + eventName);

            CellStyle eventNameStyle = workbook.createCellStyle();
            Font eventFont = workbook.createFont();
            eventFont.setBold(true);
            eventFont.setFontHeightInPoints((short) 14);
            eventNameStyle.setFont(eventFont);
            eventNameCell.setCellStyle(eventNameStyle);

            // Merge các cột (từ 0 đến 4) để tên sự kiện hiển thị trọn dòng
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 4));

            // =======================
            // 2️⃣ Header bảng
            // =======================
            Row header = sheet.createRow(2); // bỏ 1 dòng trống
            String[] columns = {"STT", "Tên", "MSSV", "Check-in", "Check-out"};
            for (int i = 0; i < columns.length; i++) {
                Cell cell = header.createCell(i);
                cell.setCellValue(columns[i]);
                CellStyle style = workbook.createCellStyle();
                Font font = workbook.createFont();
                font.setBold(true);
                style.setFont(font);
                cell.setCellStyle(style);
            }

            // =======================
            // 3️⃣ Ghi dữ liệu
            // =======================
            int rowIdx = 3;
            for (int i = 0; i < attendees.size(); i++) {
                EventAttendeeDTO dto = attendees.get(i);
                Row row = sheet.createRow(rowIdx++);

                row.createCell(0).setCellValue(i + 1);
                row.createCell(1).setCellValue(dto.getUserName());
                row.createCell(2).setCellValue(dto.getStudentId());
                row.createCell(3).setCellValue(dto.getCheckInTime() != null ? dto.getCheckInTime().toString() : "");
                row.createCell(4).setCellValue(dto.getCheckOutTime() != null ? dto.getCheckOutTime().toString() : "");
            }

            // Auto-size cột
            for (int i = 0; i < 5; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }
}
