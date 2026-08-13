# ScamLens VN - AI Riser Vietnam 2026

ScamLens VN là một Hệ thống Trợ lý An ninh Mạng (AI Scam Protection Assistant) ứng dụng Trí tuệ Nhân tạo (Google Gemini) để phát hiện, phân tích và hướng dẫn người dùng phòng tránh các rủi ro lừa đảo trực tuyến (Scam/Phishing) tại Việt Nam.

---

## 🛠 Yêu cầu hệ thống (Prerequisites)
Trước khi chạy dự án, hãy đảm bảo máy tính của bạn đã cài đặt:
1. **Node.js** (Phiên bản 18 trở lên) - Dành cho Frontend.
2. **Python** (Phiên bản 3.9 trở lên) - Dành cho Backend.
3. **Môi trường ảo (Virtual Environment)** của Python (Tùy chọn nhưng khuyên dùng).

---

## 🚀 Hướng dẫn khởi chạy dự án (Chạy cục bộ - Local)

Dự án được chia thành 2 phần độc lập: **Backend** (Xử lý AI & Logic) và **Frontend** (Giao diện người dùng). Bạn cần mở 2 cửa sổ Terminal (Command Prompt / PowerShell) riêng biệt để chạy song song 2 hệ thống này.

### Phần 1: Khởi chạy Backend (FastAPI + Python)

1. Mở Terminal mới và di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```

2. Tạo và kích hoạt môi trường ảo (Virtual Environment):
   - **Windows:**
     ```bash
     python -m venv venv
     .\venv\Scripts\activate
     ```
   - **Mac/Linux:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. Cài đặt các thư viện cần thiết:
   ```bash
   pip install -r requirements.txt
   ```

4. Cấu hình biến môi trường:
   - Đảm bảo trong thư mục `backend` có file `.env`.
   - File `.env` cần chứa API Key của Google Gemini:
     ```env
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

5. Chạy Server Backend:
   ```bash
   uvicorn app.main:app --reload
   ```
   > Server sẽ chạy tại địa chỉ: **http://127.0.0.1:8080**
   > Để xem tài liệu API (Swagger UI), truy cập: **http://127.0.0.1:8080/docs**

---

### Phần 2: Khởi chạy Frontend (Next.js + TypeScript)

1. Mở một Terminal MỚI (giữ nguyên Terminal của Backend đang chạy) và di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```

2. Cài đặt các gói thư viện (NPM Packages):
   ```bash
   npm install
   ```

3. Cấu hình biến môi trường:
   - Đảm bảo trong thư mục `frontend` có file `.env.local`.
   - File này cần chứa cấu hình Firebase và link API Backend:
     ```env
     NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
     
     NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
     ```

4. Chạy Server Frontend:
   ```bash
   npm run dev
   ```
   > Web app sẽ chạy tại địa chỉ: **http://localhost:3000**

---

## 🎯 Luồng hoạt động (Workflow)
1. Bạn mở trình duyệt truy cập `http://localhost:3000`.
2. Giao diện Frontend sẽ gọi đến Backend qua đường dẫn `http://127.0.0.1:8080/api/analyze` và `/api/chat`.
3. Nhớ phải đảm bảo **CẢ HAI** Terminal (Frontend và Backend) đều đang chạy và không báo lỗi nhé!

Chúc bạn có một trải nghiệm tuyệt vời với ScamLens VN! Khởi chạy ngay và thử nghiệm các tính năng AI cực đỉnh.
