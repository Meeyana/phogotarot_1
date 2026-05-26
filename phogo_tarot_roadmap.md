# Báo cáo Tiến độ & Kế hoạch Phát triển: Phở Gõ Tarot

Tài liệu này tổng hợp toàn bộ bối cảnh, kiến trúc hiện tại và những công việc đã hoàn thành của hệ thống "Phở Gõ Tarot", đồng thời đề ra Roadmap chi tiết để triển khai hệ thống Thương mại hóa (Có đăng nhập, quản lý user và thu phí/trừ credit) dựa trên Cấu trúc Database (Schema) đã được thiết kế sẵn.

Tài liệu này có thể được dùng làm **Bối cảnh (Context)** để cung cấp cho bất kỳ AI/LLM hoặc Lập trình viên nào tiếp quản hệ thống trong các phiên làm việc tiếp theo.

---

## I. TỔNG QUAN KIẾN TRÚC HIỆN TẠI

Hệ thống được thiết kế theo kiến trúc **Serverless** linh hoạt, tối ưu chi phí và hiệu năng cao.

1. **Frontend & Backend-for-Frontend:**
   - **Framework:** Astro (SSR Mode).
   - **Hosting/Execution:** Cloudflare Pages (hoạt động tương tự Cloudflare Workers, chạy trên V8 Isolates).
   - **Giao diện:** Thiết kế giao diện chat tương tác trực tiếp (`/xem-tarot`) với khả năng render card 3D, modal bốc bài, tối ưu trải nghiệm (UX) và tự phục hồi trạng thái (Self-healing UX) khi user lỡ F5.

2. **Cơ sở dữ liệu (Database):**
   - **Dịch vụ:** Cloudflare D1 (Serverless SQLite).
   - **Các bảng chính đang dùng:**
     - `tarot_database`: Lưu thông tin 78 lá bài (tên, ý nghĩa xuôi, ý nghĩa ngược).
     - `user_profiles`: Lưu thông tin cá nhân hóa của user (id, full_name, nickname, gender, occupation...) để LLM gọi tên và xưng hô thân mật.
   - **Các bảng đã định nghĩa sẵn trong `database/schema/` (chuẩn bị tích hợp):**
     - Auth: `01_users`, `02_user_profiles`, `03_auth_providers`, `10_sessions`.
     - Thanh toán & Tín dụng: `04_credit_wallets`, `05_payment_transactions`, `06_credit_transactions`.
     - Lịch sử Chat & Bài: `07_conversations`, `08_tarot_readings`, `09_message_logs`.

3. **Orchestration & LLM Routing (n8n):**
   - **Dịch vụ:** n8n Workflow Automation.
   - **Nhiệm vụ:**
     - Nhận payload từ Astro API (`tarot-validate.ts`, `tarot-interpret.ts`).
     - Gắn kết với các LLM provider (OpenAI / các LLM giá rẻ khác qua router).

---

## II. NHỮNG TÍNH NĂNG ĐÃ HOÀN THIỆN TỚI THỜI ĐIỂM HIỆN TẠI

### 1. Luồng Trải bài & Tương tác (Core Flow)
- **Kiểm duyệt & Phân loại câu hỏi (Validate):**
  - Nhận diện câu hỏi cần bốc bài (`pick_card = true`) và câu hỏi trò chuyện thông thường (`pick_card = false`).
- **Luận giải Bài (Interpret):**
  - Kết hợp ý nghĩa gốc của bài (truy vấn từ D1) và câu hỏi để tạo ra câu chuyện mạch lạc (Quá khứ - Hiện tại - Tương lai).

### 2. Trải nghiệm Người dùng (UX) & Xử lý Lỗi (Self-healing)
- **Chống mất state khi F5:** Xây dựng cơ chế lưu cờ `waitingForTarotConfirm` vào `localStorage`. Tự động khôi phục giao diện hỏi ý kiến mà không tốn token gọi lại API.
- **Cá nhân hóa:** Tự động lấy `nickname` và `gender` từ `user_profiles` để đưa vào prompt. Cấu trúc JSON truyền đi cực kỳ tinh gọn.

### 3. Tối ưu Chi phí Token
- Cắt gọt System Prompt tối đa.
- Chỉ đẩy **câu hỏi của user** vào lịch sử ngữ cảnh.
- Gộp chung thông tin lá bài (Tên + Hướng + Ý nghĩa) trên 1 dòng để AI dễ đọc và tiết kiệm text.

---

## III. ROADMAP TÍCH HỢP TÍNH NĂNG: ĐĂNG NHẬP & THU PHÍ (MONETIZATION)

Hệ thống Database Schema đã có đầy đủ trong thư mục `database/schema/`. Công việc tiếp theo là **kết nối mã nguồn Astro** với các bảng này.

### PHASE 1: Triển khai Authentication với Database có sẵn
Mục tiêu: Đưa các bảng `users`, `user_profiles`, `auth_providers`, `sessions` vào hoạt động thực tế.

- [x] **Giao diện Login/Register:** Cập nhật Navbar, tạo modal/trang đăng nhập hỗ trợ Email/Pass hoặc OAuth (Google/Facebook).
- [x] **Xử lý Backend Auth:** 
  - Viết API `POST /api/auth/login`, `POST /api/auth/register`.
  - Viết logic tạo session (ghi vào bảng `sessions`), cấp Cookie cho Client.
- [x] **Cập nhật Middleware (`middleware.ts`):** 
  - Đọc Cookie, join bảng `sessions` và `users` để xác thực, gán vào `context.locals.user`.

### PHASE 2: Triển khai Hệ thống Credit (Lượt hỏi)
Mục tiêu: Mỗi câu hỏi/trải bài sẽ tiêu tốn 1 lượng Credit từ bảng `credit_wallets`.

- [x] **Gán Credit mặc định:** Khi tạo User mới, tự động chèn 1 bản ghi vào `credit_wallets` với `balance` khởi tạo (VD: 3 lượt miễn phí).
- [ ] **Logic Trừ Credit (`tarot-validate.ts` / `tarot-interpret.ts`):**
  - Trước khi gọi n8n: Query bảng `credit_wallets`. Nếu `balance <= 0` -> Trả lỗi 402 Payment Required.
  - Sau khi n8n phản hồi thành công: Thực hiện lệnh `UPDATE credit_wallets SET balance = balance - 1 WHERE user_id = ?` và ghi lại 1 log vào `credit_transactions`.

### PHASE 3: Cổng thanh toán (Payment Gateway)
Mục tiêu: User có thể mua thêm Credit, thông tin nạp được ghi vào `payment_transactions`.

- [ ] **UI Bảng giá:** Hiển thị các gói nạp (Vd: 20k = 10 lượt, 50k = 30 lượt).
- [ ] **Tích hợp Thanh toán:**
  - Kết nối VietQR (SePay/Cassos) hoặc cổng thanh toán khác.
- [ ] **Xử lý Webhook:** Nhận thông báo giao dịch thành công -> `INSERT` vào `payment_transactions` -> Tự động cộng `balance` vào `credit_wallets` -> Bắn thông báo (Email/UI) cho user.

### PHASE 4: Lưu trữ & Quản lý Lịch sử Hội thoại
Mục tiêu: Bỏ dần `localStorage`, đồng bộ toàn bộ dữ liệu lên D1 để user xem lại trên mọi thiết bị.

- [ ] **Ghi dữ liệu lúc chat:**
  - Sửa đổi API để chèn (INSERT) vào `conversations` khi bắt đầu luồng chat.
  - Ghi mọi tin nhắn (user + AI) vào bảng `message_logs`.
  - Nếu có trải bài, chèn vào bảng `tarot_readings` (lưu ID 3 lá bài, vị trí, chủ đề).
- [ ] **Trang Nhật ký (History Dashboard):** Tạo trang `/history` để query `conversations` & `tarot_readings`, hiển thị lại quá khứ đẹp mắt cho user đã đăng nhập.

### PHASE 5: Nâng cấp Chất lượng Sản phẩm (Product Quality)
Mục tiêu: Đa dạng hóa trải nghiệm để tăng giá trị sản phẩm (đủ sức thuyết phục người dùng trả phí).

- [ ] **Đa dạng hóa Hình thức Trải bài (Reading Types):**
  - Giao diện cho phép chuyển đổi linh hoạt: **Bốc 1 lá** (Thông điệp nhanh trong ngày), **Yes/No Question**, và **3 lá (Quá khứ - Hiện tại - Tương lai)**.
  - Cập nhật luồng UI Modal rút bài: Dựa vào loại trải bài đang chọn để render số lượng bài lật phù hợp.
  - Cập nhật Payload n8n: Truyền biến `reading_type` để AI nhận diện dạng bài (Ví dụ nếu Yes/No thì AI tập trung vào việc đưa ra đáp án Có/Không dựa trên lá bài).
- [ ] **Tùy chỉnh Văn phong Reader (Tone of Voice):**
  - Thêm lựa chọn trong Profile hoặc lúc chuẩn bị bốc bài để user chọn "Tính cách Reader":
    - *Người bạn chữa lành* (Ấm áp, đồng cảm).
    - *Chuyên gia thẳng thắn* (Trực diện, sắc sảo).
    - *Trưởng lão huyền bí* (Uyên thâm, dùng nhiều ẩn dụ).
  - Cập nhật Payload: Truyền biến `reader_tone` vào n8n để nội suy (bundle) trực tiếp vào System Prompt.
- [x] **Tích hợp Đăng nhập Mạng xã hội (OAuth):**
  - Do đã có form Email/Password cơ bản, cần bổ sung Google/Facebook Auth để giảm rào cản đăng ký cho user.
