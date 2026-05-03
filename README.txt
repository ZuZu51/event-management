# Event Management — Setup Guide

**Yêu cầu trước:**
- Java 11+ (hoặc phiên bản tương thích với project)
- Node.js 16+ / npm
- Git
- Cơ sở dữ liệu: MySQL

**Cấu trúc chính:**
- `event-management      — backend (Spring Boot, Maven)
- `event-management-app  — frontend (React + Vite)

**Database**
1. Create database with name: event_managemnet

**Backend — thiết lập & chạy**
1. Di chuyển vào thư mục backend: event-management

2. Build:
cmd: .\mvnw.cmd clean package -DskipTests

3. Chạy ứng dụng:
cmd: .\mvnw.cmd spring-boot:run


**Frontend — thiết lập & chạy**
1. Di chuyển vào thư mục frontend: event-management-app


2. Cài dependencies và chạy development server:
npm install
npm run dev



