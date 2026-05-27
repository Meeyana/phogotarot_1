# 🔮 BÁO CÁO PHÂN TÍCH CHẤT LƯỢNG AI OUTPUT & HỆ THỐNG PROMPT: PHỞ GÕ TAROT

> **Ngày cập nhật**: 27/05/2026  
> **Trọng tâm đánh giá**: Chất lượng lời dịch/luận giải, Tính chân thực của các Reader Persona, Trải nghiệm đàm thoại tiếp nối (Conversational Loop), Kiểm soát An toàn nội dung (Safeguards) & Logic thiết kế Prompt trong [tarot.json](file:///D:/Tuan/phogotarot/tarot.json)

---

## 📊 BẢNG ĐIỂM ĐÁNH GIÁ CHẤT LƯỢNG SẢN PHẨM (AI OUTPUT & USER EXPERIENCE)

| # | Tiêu chí đánh giá chất lượng | Điểm số | Trạng thái & Vấn đề cốt lõi |
|---|---|---|---|
| 1 | 🧠 **Trí nhớ đàm thoại (Follow-up Loop)** | **2.0**/10 | 🔴 **Nghiêm trọng**: Mất hoàn toàn bối cảnh lời khuyên trước đó của Bot. |
| 2 | 🎭 **Cá tính Reader (Narrative Personas)** | **4.0**/10 | ⚠️ **Mờ nhạt**: Các Reader bị "san phẳng" văn phong giống nhau đến 85%. |
| 3 | 📜 **Tính tự nhiên trong Luận giải (Turn 1)** | **5.0**/10 | ⚠️ **Rập khuôn**: Cấu trúc bài giải bị cơ khí, lặp đi lặp lại một bộ khung. |
| 4 | 🛡️ **Kiểm soát nội dung nhạy cảm (Safeguards)** | **3.0**/10 | 🔴 **Nguy hiểm**: Không có bộ lọc cảnh báo các chủ đề cực đoan, y tế, pháp luật. |
| 5 | 🧩 **Độ mượt khi phối hợp ý nghĩa bài** | **5.5**/10 | ⚠️ **Khiên cưỡng**: Ép từ khóa tĩnh trong DB vào ngữ cảnh động của khách hàng. |
| 6 | ⚖️ **Đạo đức Tarot Reader (Future-telling)** | **5.0**/10 | ⚠️ **Rủi ro**: Dễ rơi vào phán xét tương lai tuyệt đối gây hoang mang cho người dùng. |

### 🏆 ĐIỂM CHẤT LƯỢNG SẢN PHẨM TRUNG BÌNH: **4.1 / 10**  
> *Đánh giá tổng quan: Chatbot hoạt động trôi chảy về mặt kỹ thuật, nhưng chất lượng nội dung đầu ra còn mang nặng tính robot công nghiệp, thiếu đi sự thấu cảm sâu sắc, tính cá nhân hóa và các chốt chặn an toàn cần thiết của một sản phẩm thương mại cao cấp.*

---

## 🔍 CHI TIẾT 6 ĐIỂM YẾU CHÍ MẠNG VỀ CHẤT LƯỢNG AI OUTPUT

### 1. Lỗ hổng Trí nhớ trong Đàm thoại tiếp nối (Follow-up Loop)
*   **Vấn đề cốt lõi:** Trong node `build conversational prompt` (dòng 128) và `build interpretation prompt` (dòng 221) trong [tarot.json](file:///D:/Tuan/phogotarot/tarot.json), hệ thống xây dựng lịch sử hội thoại bằng cách lọc và truyền **chỉ danh sách các câu hỏi trước đó của User** (`history.filter(msg => msg.role === 'user').map(msg => msg.content)`). Hệ thống hoàn toàn **bỏ qua việc gửi các câu trả lời trước đó của Bot**.
*   **Ảnh hưởng chất lượng:** Khi khách hàng hỏi tiếp nối những câu mang tính chất tham chiếu như: *"Tại sao bạn lại khuyên tôi nên dừng lại ở lá thứ 2?"* hoặc *"Bạn giải thích rõ hơn ý bạn vừa nói đi"*, AI hoàn toàn bị "mất trí nhớ". Nó không biết lá thứ hai là gì và trước đó nó đã khuyên những gì. AI sẽ bắt buộc phải tự "bịa" ra bối cảnh cũ, gây ra sự bất nhất thông tin và làm khách hàng ngay lập tức mất lòng tin.

### 2. Sự "San Phẳng" Cá Tính của các Reader (Narrative Personas)
*   **Vấn đề cốt lõi (Recency Bias & Hệ thống chỉ thị chồng chéo):** 
    1. Chuỗi Prompt hệ thống đang được ghép nối thô sơ: `narrativeBase (System prompt của Reader) + Quy tắc chung cứng nhắc`. Các quy tắc chung viết sau có xu hướng đè bẹp (override) cá tính riêng ở phía trước do cơ chế hoạt động của LLM.
    2. Các quy tắc chung chứa những từ khóa ép buộc văn phong rất mạnh như: *"Giọng văn con người trầm ổn, đồng cảm"*, *"TUYỆT ĐỐI KHÔNG nhắc đến AI"*.
*   **Ảnh hưởng chất lượng:** Bất kể người dùng chọn Reader nào (một Witcher ma mị lạnh lùng, một Joanna ngọt ngào ấm áp hay một Cô Gia Đình Vĩ Đại bao dung), văn phong phản hồi của AI trả về đều bị điều hướng về cùng một kiểu: "trầm ổn, đồng cảm, trang trọng". Việc cá nhân hóa chọn Reader gần như chỉ có tác dụng thay đổi Avatar trên giao diện chứ chưa thực sự thổi hồn vào chất lượng câu chữ.

### 3. Cấu trúc bài luận giải quá rập khuôn và máy móc (Turn 1)
*   **Vấn đề cốt lõi:** Prompt mặc định áp đặt một outline bắt buộc vô cùng cứng nhắc:
    > Lời chào mở đầu (1-2 câu) -> 1. Mở đầu & cảm nhận chung (2-3 câu) -> 2. Dòng chảy câu chuyện (Quá khứ -> Hiện tại -> Tương lai) (3-4 câu) -> 3. Sự kết nối giữa các lá bài (3-4 câu) -> 4. Lời khuyên từ trái tim (2-3 câu) -> Kết thúc bằng 1-2 câu tự vấn.
*   **Ảnh hưởng chất lượng:** Việc khống chế số câu và bắt buộc định dạng tiêu đề `###` máy móc khiến AI không thể viết tự nhiên. Trải nghiệm bốc bài giống như đang đọc một bài báo cáo khoa học hoặc một barem điểm văn học lớp 9 được lập trình sẵn. Người dùng bốc bài lần thứ 2 sẽ phát hiện ra sự rập khuôn này, làm mất đi tính "linh thiêng" và cá nhân hóa của Tarot.

### 4. Lỗ hổng lớn về Kiểm soát An toàn & Nội dung nhạy cảm (Safeguards)
*   **Vấn đề cốt lõi:** Node `Check câu hỏi` hiện tại chỉ lọc các câu hỏi quá ngắn, vô nghĩa hoặc không liên quan đến cuộc sống (giải toán, thời tiết, code). Hệ thống hoàn toàn **thiếu cơ chế phát hiện các chủ đề cực đoan hoặc nhạy cảm cao**.
*   **Ảnh hưởng chất lượng:** Tarot thường chạm đến những lúc con người khủng hoảng nhất. Khách hàng có thể đặt những câu hỏi như: *"Tôi có nên tự tử không?"*, *"Tôi bị bệnh ung thư có chữa được không?"*, *"Tôi có nên khởi kiện và ly hôn ngay lập tức không?"*. 
    Hiện tại, AI vẫn sẽ hồn nhiên bốc bài và đưa ra những lời phán xét hoặc khuyên bảo về Y tế, Pháp luật, hay Tâm lý cực đoan. Điều này vi phạm nghiêm trọng đạo đức phát triển AI và mở ra rủi ro pháp lý/tác động tiêu cực khôn lường tới người dùng.

### 5. Sự khiên cưỡng khi lồng ghép "Ý nghĩa tĩnh" từ Database
*   **Vấn đề cốt lõi:** Hệ thống đang nạp ý nghĩa cố định của thẻ bài từ Database (`card.meaning`) vào Prompt. Các ý nghĩa này thường là những đoạn văn tĩnh mô tả khái niệm chung chung của lá bài.
*   **Ảnh hưởng chất lượng:** Khi khách hàng đặt một câu hỏi mang ngữ cảnh rất cụ thể (ví dụ: khía cạnh học tập, tình cảm gia đình), nhưng ý nghĩa tĩnh trong DB lại viết chủ yếu về "tài chính, tiền bạc", LLM sẽ bị bối rối. Nó sẽ cố gắng gượng ép nhét các từ khóa tài chính vào bài giải để tuân thủ chỉ thị "bám sát ý nghĩa gốc", khiến câu trả lời trở nên lệch tông, thiếu mạch lạc.

### 6. Nguy cơ Ảo giác và Tuyên bố Tương lai Tuyệt đối (Future-telling)
*   **Vấn đề cốt lõi:** Prompt chưa có các điều khoản cấm đoán từ ngữ mang tính định đoạt tương lai.
*   **Ảnh hưởng chất lượng:** Tarot thực chất là sự gợi mở năng lượng và đưa ra lời khuyên để khách hàng tự quyết định cuộc đời. Nếu không được kiểm soát ngôn từ, AI có thể đưa ra các tuyên bố mang tính khẳng định tuyệt đối như: *"Người ấy chắc chắn đang cắm sừng bạn"*, *"Bạn sẽ gặp tai nạn vào tháng sau"*, *"Học kỳ này bạn chắc chắn trượt"*. Những câu phán xét vô căn cứ này sẽ gây hoang mang, hoảng sợ cực độ cho những người dùng có tâm lý yếu.

---

## 🛠️ LỘ TRÌNH NÂNG CẤP CHẤT LƯỢNG SẢN PHẨM (PROMPT ACTION PLAN)

Để nâng cấp toàn diện chất lượng AI Output của Phở Gõ Tarot, chúng ta cần triển khai kế hoạch hành động chia thành 3 giai đoạn:

### Giai đoạn 1: Nâng cấp Trí nhớ Đàm thoại & Sửa đổi Payload (Ưu tiên số 1)
*   **Hành động:** 
    1. Cập nhật API backend `/api/tarot-interpret` và `/api/tarot-validate` để gửi **toàn bộ lịch sử hội thoại dạng cặp đôi** (User - Assistant) sang n8n thay vì chỉ lọc mỗi câu hỏi của User.
    2. Định dạng lại cấu trúc truyền lịch sử trong Prompt:
       ```
       ### [LỊCH SỬ CUỘC HỘI THOẠI]
       - Khách hàng: "Tình yêu sắp tới của tôi ra sao?"
       - Reader: "Tôi thấy lá The Lovers chỉ ra..." (Bốc các lá: The Lovers, Death, Star)
       - Khách hàng: "Giải thích thêm cho tôi lá Death được không?"
       ```
    3. LLM trong conversational loop sẽ nhận biết rõ ràng bối cảnh để giải thích tiếp nối hoàn hảo.

### Giai đoạn 2: Thiết kế lại Persona Reader & Mềm hóa cấu trúc (Ưu tiên số 2)
*   **Hành động:**
    1. Tạo một cấu trúc Prompt chuyên biệt cho từng Reader Persona trong Database, bao gồm các biến: `xưng_hô`, `văn_phong` (ví dụ: thần bí, hóm hỉnh, sâu sắc), `cách_dẫn_dắt` và `giới_hạn_emoji`.
    2. Tái thiết kế System Prompt trong `tarot.json`: Đưa Reader Prompt xuống làm trung tâm, thay đổi vị trí của các chỉ thị chung lên đầu và biến chúng thành các nguyên tắc kỹ thuật không màu sắc văn phong.
    3. Loại bỏ outline 4 phần cứng nhắc và giới hạn số câu. Thay vào đó, định hướng AI giải bài theo cấu trúc mở:
       * *Phần 1: Cảm nhận trực giác & Lời chào thân tình.*
       * *Phần 2: Luận giải sự liên kết của 3 lá bài chảy theo câu chuyện của khách hàng.*
       * *Phần 3: Thông điệp cốt lõi & Gợi ý tự vấn.*

### Giai đoạn 3: Vá lỗ hổng An toàn (Safeguards) & Chuẩn hóa Đạo đức (Ưu tiên số 3)
*   **Hành động:**
    1. Thêm chỉ thị nghiêm ngặt vào node `Check câu hỏi` (Validate) để phát hiện các chủ đề nhạy cảm:
       * **Y tế / Sức khỏe**: Nếu hỏi bệnh tật, sống chết -> Từ chối lịch sự và khuyên họ đi gặp bác sĩ.
       * **Pháp luật**: Nếu hỏi kiện tụng, tranh chấp pháp lý -> Khuyên gặp luật sư.
       * **Tâm lý cực đoan**: Nếu hỏi tự tử, bạo lực -> Trả về thông điệp hỗ trợ khẩn cấp kèm hotline hỗ trợ tâm lý.
    2. Cập nhật nguyên tắc luồng luận giải: **Tuyệt đối không phán xét tương lai dạng khẳng định 100%**. Yêu cầu AI luôn sử dụng các từ ngữ mang tính gợi mở năng lượng, định hướng hành động (Ví dụ: *"Năng lượng hiện tại đang chỉ ra...", "Đây là cơ hội để bạn nhìn nhận lại...", "Lời khuyên dành cho bạn..."*).
