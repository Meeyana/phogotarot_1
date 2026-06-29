# Phở Gõ Tarot PDFMake Exporter

Folder này là app PDF riêng, tách khỏi trang Astro hiện tại. Nó tạo PDF thật bằng `pdfmake`, không dùng `window.print`, không dùng Browser Run/Browser Rendering.

## Công nghệ

- `Cloudflare Pages` để host app tĩnh.
- `pdfmake` chạy client-side để tạo file PDF.
- Ảnh bìa và logo nằm trong `public/images`.
- Dữ liệu đầu vào là report JSON có shape giống kết quả của `buildNumerologyReport(...)`.

## Cách chạy

```bash
cd pdfmake-exporter
npm install
npm run dev
```

Deploy Cloudflare Pages:

```bash
npm run build
```

Build output: `dist`.

## Cơ chế giao tiếp với trang hiện tại

Trang hiện tại nên build report bằng logic đang có:

```ts
const report = await buildNumerologyReport({ fullName, dobStr, nickname, gender });
```

Sau đó gửi report sang app này bằng `postMessage`, không nhét full JSON lên query string để tránh URL quá dài.

Snippet tích hợp phía trang hiện tại:

```js
async function openNumerologyPdfExporter(report) {
  const exporterUrl = "https://pdf-exporter-domain.pages.dev";
  const target = window.open(exporterUrl, "phogotarot-pdf-exporter");
  if (!target) throw new Error("Trình duyệt đang chặn popup tải PDF.");

  const send = () => target.postMessage({
    type: "PHOGOTAROT_NUMEROLOGY_REPORT",
    report
  }, new URL(exporterUrl).origin);

  const timer = setInterval(send, 500);
  window.addEventListener("message", function onReady(event) {
    if (event.origin !== new URL(exporterUrl).origin) return;
    if (event.data?.type !== "PHOGOTAROT_PDF_EXPORTER_READY") return;
    clearInterval(timer);
    send();
    window.removeEventListener("message", onReady);
  });

  setTimeout(() => clearInterval(timer), 10000);
}
```

## Outline đã map từ PDF cũ

- Bìa báo cáo: logo, tên, ngày sinh, ngày xuất, ảnh bìa.
- Mục lục báo cáo: 18 mục, pdfmake tự tính số trang thật và tạo link nội bộ.
- I. Nền tảng cốt lõi:
  1. Số chủ đạo
  2. Số Sứ Mệnh
  3. Số Linh Hồn
  4. Số Nhân Cách
  5. Số Thái Độ
  6. Số Tư Duy
  7. Số Trưởng Thành
- II. Biểu đồ & cấu trúc:
  8. Biểu Đồ Ngày Sinh
  9. Biểu Đồ Tên & Tổng Hợp
  10. Kim Tự Tháp Thần Số
  11. Chỉ Số Nợ Nghiệp
  12. Bài Học Đường Đời
- III. Nhóm tính cách & định hướng:
  13. Nhóm Tính Cách Bản Ngã
  14. Tỉ Lệ Nhóm Ngành Phù Hợp
- IV. Dòng thời gian:
  15. Chu Kỳ Đường Đời
  16. Chu Kỳ Vận Số 9 Năm
  17. Dự Báo Năm Cá Nhân
  18. Dự Báo Tháng Cá Nhân
- Trang cảm ơn cuối.

## Ghi chú quan trọng

PDF này được dựng bằng PDF primitives, không phải HTML/CSS. Vì vậy layout ổn định hơn browser print, nhưng muốn giống 100% bản cũ thì cần tinh chỉnh dần bằng dữ liệu thật và render test.
