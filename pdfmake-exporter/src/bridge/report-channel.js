const STORAGE_KEY = "phogotarot:numerology-report";

export function readStoredReport() {
  const raw = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function writeStoredReport(report, persistent = false) {
  const raw = JSON.stringify(report);
  sessionStorage.setItem(STORAGE_KEY, raw);
  if (persistent) localStorage.setItem(STORAGE_KEY, raw);
}

export function clearStoredReport() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
}

export function listenForReport(callback) {
  window.addEventListener("message", (event) => {
    const message = event.data;
    if (!message || message.type !== "PHOGOTAROT_NUMEROLOGY_REPORT") return;
    if (!message.report || typeof message.report !== "object") return;

    writeStoredReport(message.report);
    callback(message.report, { autoDownload: message.autoDownload === true });
  });

  window.opener?.postMessage({ type: "PHOGOTAROT_PDF_EXPORTER_READY" }, "*");
}

export function currentSiteBridgeSnippet(exporterUrl) {
  return `
async function openNumerologyPdfExporter(report) {
  const target = window.open(${JSON.stringify(exporterUrl)}, "phogotarot-pdf-exporter");
  if (!target) throw new Error("Trình duyệt đang chặn popup tải PDF.");

  const send = () => target.postMessage({
    type: "PHOGOTAROT_NUMEROLOGY_REPORT",
    report
  }, ${JSON.stringify(new URL(exporterUrl).origin)});

  const timer = setInterval(send, 500);
  window.addEventListener("message", function onReady(event) {
    if (event.origin !== ${JSON.stringify(new URL(exporterUrl).origin)}) return;
    if (event.data?.type !== "PHOGOTAROT_PDF_EXPORTER_READY") return;
    clearInterval(timer);
    send();
    window.removeEventListener("message", onReady);
  });

  setTimeout(() => clearInterval(timer), 10000);
}
`;
}
