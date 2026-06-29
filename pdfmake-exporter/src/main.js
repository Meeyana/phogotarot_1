import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
import { buildPdfDefinition } from "./pdf/report-definition.js";
import { clearStoredReport, listenForReport, readStoredReport, writeStoredReport } from "./bridge/report-channel.js";

pdfMake.vfs = pdfFonts.pdfMake?.vfs || pdfFonts.vfs || pdfFonts;
pdfMake.fonts = {
  Roboto: {
    normal: "Roboto-Regular.ttf",
    bold: "Roboto-Medium.ttf",
    italics: "Roboto-Italic.ttf",
    bolditalics: "Roboto-MediumItalic.ttf"
  },
  PlayfairDisplay: {
    normal: "/fonts/playfair-display-400.ttf",
    bold: "/fonts/playfair-display-900.ttf",
    italics: "/fonts/playfair-display-400.ttf",
    bolditalics: "/fonts/playfair-display-900.ttf"
  }
};

const payloadEl = document.getElementById("payload");
const downloadBtn = document.getElementById("download");
const openBtn = document.getElementById("open");
const clearBtn = document.getElementById("clear");
const statusEl = document.getElementById("status");

let activeReport = null;

bootstrap();

function bootstrap() {
  const stored = readStoredReport();
  if (stored) {
    setReport(stored, "Đã nạp dữ liệu report từ phiên làm việc trước.");
  }

  listenForReport((report, options = {}) => {
    setReport(report, "Đã nhận dữ liệu từ trang thần số học. Có thể tải PDF.");
    if (options.autoDownload) {
      setTimeout(() => exportPdf("download"), 100);
    }
  });

  downloadBtn.addEventListener("click", () => exportPdf("download"));
  openBtn.addEventListener("click", () => exportPdf("open"));
  clearBtn.addEventListener("click", () => {
    clearStoredReport();
    activeReport = null;
    payloadEl.value = "";
    status("Đã xóa dữ liệu test.");
  });

  payloadEl.addEventListener("input", () => {
    const text = payloadEl.value.trim();
    if (!text) return;

    try {
      const parsed = JSON.parse(text);
      setReport(parsed, "Đã đọc report JSON trong ô test.");
      writeStoredReport(parsed);
    } catch {
      status("JSON chưa hợp lệ.");
    }
  });

  status(activeReport ? "Sẵn sàng tạo PDF." : "Đang chờ dữ liệu report...");
}

function setReport(report, message) {
  activeReport = normalizeReport(report);
  payloadEl.value = JSON.stringify(activeReport, null, 2);
  status(message);
}

async function exportPdf(mode) {
  if (!activeReport) {
    status("Chưa có dữ liệu report. Hãy mở từ trang hiện tại hoặc dán JSON để test.");
    return;
  }

  setBusy(true);
  try {
    status("Đang chuẩn bị ảnh và dựng PDF...");
    const assets = await loadAssets();
    const definition = await buildPdfDefinition(activeReport, assets);
    const filename = makeFilename(activeReport);

    if (mode === "open") {
      pdfMake.createPdf(definition).open();
    } else {
      pdfMake.createPdf(definition).download(filename);
    }

    status("Đã tạo PDF bằng pdfmake. Không dùng Browser Run.");
  } catch (error) {
    console.error(error);
    status(`Không tạo được PDF: ${error.message}`);
  } finally {
    setBusy(false);
  }
}

function normalizeReport(report) {
  return {
    ...report,
    definitions: report.definitions || defaultDefinitions()
  };
}

async function loadAssets() {
  return {
    logo: await imageToDataUrl("/images/logo-l.png"),
    coverArtwork: await imageToDataUrl("/images/cover-artwork.png")
  };
}

async function imageToDataUrl(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Không tải được ảnh: ${path}`);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function makeFilename(report) {
  const name = report.input?.fullName || "than-so-hoc";
  return `Bao-cao-than-so-hoc-${name}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() + ".pdf";
}

function setBusy(isBusy) {
  downloadBtn.disabled = isBusy;
  openBtn.disabled = isBusy;
}

function status(message) {
  statusEl.textContent = message;
}

function defaultDefinitions() {
  return {
    lifePath: "Số chủ đạo cho biết năng lượng nền tảng, xu hướng phát triển và bài học lớn đi theo bạn trong cuộc đời.",
    destiny: "Chỉ số sứ mệnh cho biết bạn đến đây để phát triển điều gì, tạo ra giá trị gì và con đường thể hiện năng lực của bạn.",
    soul: "Chỉ số linh hồn phản ánh khát khao sâu thẳm nhất, động lực thầm kín và cảm xúc chân thật bên trong bạn.",
    personality: "Chỉ số nhân cách đại diện cho lớp vỏ bên ngoài, ấn tượng đầu tiên và cách người khác nhìn nhận bạn.",
    attitude: "Chỉ số thái độ phản ánh cách bạn phản ứng tự nhiên khi gặp gỡ mọi người hoặc đối mặt với tình huống mới.",
    rational: "Chỉ số tư duy cho thấy cách bạn xử lý thông tin, suy nghĩ và ra quyết định.",
    maturity: "Chỉ số trưởng thành là năng lượng cốt lõi dần được kích hoạt qua thử thách, học hỏi và chuyển hóa.",
    birthChart: "Biểu đồ ngày sinh thể hiện sức mạnh nguyên thủy, điểm mạnh, điểm yếu và các đặc điểm tính cách nổi bật.",
    pyramid: "Kim tự tháp thần số học mô tả các đỉnh cao và thử thách quan trọng theo từng giai đoạn cuộc đời.",
    karmicDebt: "Chỉ số nợ nghiệp phản ánh những bài học sâu liên quan đến khuôn mẫu cũ hoặc điều cần chuyển hóa.",
    karmicLessons: "Bài học đường đời cho thấy những mặt còn thiếu hoặc điểm yếu cần bồi đắp.",
    personalityGroup: "Nhóm tính cách bản ngã cho thấy các nhóm năng lượng tính cách nổi bật trong bạn.",
    careerGroup: "Tỉ lệ nhóm ngành phù hợp đối chiếu đặc điểm tính cách, thế mạnh bẩm sinh và năng lượng cá nhân."
  };
}
