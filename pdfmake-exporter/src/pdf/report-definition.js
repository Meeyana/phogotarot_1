import { contentBlocks, safeArray } from "./content-normalizer.js";

const GOLD = "#c7972f";
const NAVY = "#0b132b";
const INK = "#1f2633";
const MUTED = "#667085";
const LINE = "#e8dcc4";
const PAPER = "#fffaf0";
const SOFT = "#f7efe0";
const A4 = { width: 595.28, height: 841.89 };

export async function buildPdfDefinition(report, assets = {}) {
  const now = new Date().toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const input = report.input || {};
  const numbers = report.numbers || {};
  const content = report.content || {};
  const chartData = report.chartData || {};
  const pyramid = report.pyramid || {};
  const periodCycles = report.periodCycles || {};
  const forecast = report.forecast || {};
  const personalityStats = safeArray(report.personalityStats);
  const careerStats = safeArray(report.careerStats);
  const topTraits = [...personalityStats].sort((a, b) => (b.percent || 0) - (a.percent || 0)).slice(0, 3);
  const topCareer = [...careerStats].sort((a, b) => (b.percent || 0) - (a.percent || 0)).slice(0, 3);

  const sections = [];

  sections.push(coverPage(input, now, assets));
  sections.push(tocPage());
  sections.push(coreSection(report));
  sections.push(chartSection(report));
  sections.push(directionSection(report, topTraits, topCareer));
  sections.push(timelineSection(report));
  sections.push(backCover(assets));

  return {
    pageSize: "A4",
    pageMargins: [54, 62, 54, 58],
    info: {
      title: `Báo cáo Thần Số Học - ${input.fullName || ""}`,
      author: "Phở Gõ Tarot",
      subject: "Báo cáo Thần Số Học"
    },
    background(currentPage) {
      if (currentPage === 1) return fullPageImage(assets.coverArtwork);
      return [
        assets.logo ? { image: assets.logo, width: 260, opacity: 0.07, absolutePosition: { x: 168, y: 285 } } : {}
      ];
    },
    footer(currentPage, pageCount) {
      if (currentPage === 1 || currentPage === pageCount) return {};
      const footerIdentity = `© Copyright 2026 - ${input.fullName || "Phở Gõ Tarot"} - ${input.formattedDob || input.dobStr || ""}`;
      return {
        margin: [36, 24, 36, 0],
        columns: [
          { text: footerIdentity, style: "footerText" },
          { text: `${String(currentPage - 1).padStart(2, "0")} / ${String(pageCount - 2).padStart(2, "0")}`, alignment: "right", style: "footerText" }
        ]
      };
    },
    content: sections.flat(),
    styles: styles(),
    defaultStyle: {
      font: "Roboto",
      color: INK,
      fontSize: 13,
      lineHeight: 1.34
    }
  };
}

function coverPage(input, generatedAt, assets) {
  return [
    {
      stack: [
        assets.logo ? { image: assets.logo, width: 100, alignment: "center", margin: [0, 0, 0, 100] } : {},
        { text: "BÁO CÁO\nTHẦN SỐ HỌC", style: "coverTitle" },
        { text: input.fullName || "Bạn Mình", style: "coverName" },
        {
          margin: [52, 34, 52, 0],
          columns: [
            metaBox("Ngày sinh", input.formattedDob || input.dobStr || ""),
            metaBox("Ngày xuất", generatedAt)
          ]
        },
        { text: "Copyright 2026 - phogotarot.com.", style: "coverNote", margin: [0, 126, 0, 0] }
      ],
      pageBreak: "after",
      margin: [0, 62, 0, 0]
    }
  ];
}

function metaBox(label, value) {
  return {
    width: "*",
    margin: [10, 0, 10, 0],
    table: {
      widths: ["*"],
      body: [[
        {
          stack: [
            { text: label.toUpperCase(), style: "metaLabel" },
            { text: value, style: "metaValue" }
          ],
          border: [false, false, false, true],
          borderColor: ["", "", "", "#b9aa88"],
          margin: [0, 6, 0, 8]
        }
      ]]
    },
    layout: "noBorders"
  };
}

function tocPage() {
  return [
    {
      toc: {
        title: { text: "Mục lục báo cáo", style: "pageTitle" },
        numberStyle: { bold: true, color: GOLD }
      }
    },
    { text: "", pageBreak: "after" }
  ];
}

function coreSection(report) {
  const { numbers = {}, content = {} } = report;
  const core = [
    ["Số Sứ Mệnh", numbers.destiny, content.coreStatsDataMap?.destiny, report.definitions?.destiny],
    ["Số Linh Hồn", numbers.soul, content.coreStatsDataMap?.soul, report.definitions?.soul],
    ["Số Nhân Cách", numbers.personality, content.coreStatsDataMap?.personality, report.definitions?.personality],
    ["Số Thái Độ", numbers.attitude, content.coreStatsDataMap?.attitude, report.definitions?.attitude],
    ["Số Tư Duy", numbers.rational, content.coreStatsDataMap?.rational, report.definitions?.rational],
    ["Số Trưởng Thành", numbers.maturity, content.coreStatsDataMap?.maturity, report.definitions?.maturity]
  ];

  return [
    sectionTitle("I. Nền tảng cốt lõi"),
    subsection("1. Số chủ đạo của bạn", `Số ${numbers.lifePath}`, "section-1"),
    definition(report.definitions?.lifePath),
    ...contentBlocks(content.lifePath),
    ...core.flatMap(([label, value, data, def], idx) => [
      subsection(`${idx + 2}. ${label} của bạn`, `Số ${value}`, `section-${idx + 2}`),
      definition(def),
      ...contentBlocks(data)
    ]),
    { text: "", pageBreak: "after" }
  ];
}

function chartSection(report) {
  const chartData = report.chartData || {};
  const pyramid = report.pyramid || {};
  const content = report.content || {};
  const debts = safeArray(report.karmicDebts);
  const lessons = safeArray(report.karmicLessons);

  return [
    sectionTitle("II. Biểu đồ & cấu trúc"),
    subsection("8. Biểu Đồ Ngày Sinh", "", "section-8"),
    definition(report.definitions?.birthChart),
    numerologyGrid(chartData.strengthData),
    chartDetails("Luận giải biểu đồ ngày sinh", chartData.strengthArrows, chartData.strengthMissingNums),
    subsection("9. Biểu Đồ Tên & Tổng Hợp", "", "section-9"),
    twoColumns(numerologyGrid(chartData.nameData, "Biểu đồ tên"), numerologyGrid(chartData.synthesisData, "Biểu đồ tổng hợp")),
    chartDetails("Luận giải biểu đồ tổng hợp", chartData.synthesisArrows, chartData.synthesisMissingNums),
    subsection("10. Kim Tự Tháp Thần Số", "", "section-10"),
    definition(report.definitions?.pyramid),
    pyramidTable(pyramid),
    ...["p1", "p2", "p3", "p4"].flatMap((key) => {
      const value = pyramid.peaks?.[key];
      return value ? [{ text: `Đỉnh cao số ${value}`, style: "blockTitle" }, ...contentBlocks(content.pyramidDataStore?.peaks?.[value])] : [];
    }),
    subsection("11. Chỉ Số Nợ Nghiệp", "", "section-11"),
    definition(report.definitions?.karmicDebt),
    ...(debts.length ? debts.flatMap((debt) => [{ text: `Nợ nghiệp số ${debt}`, style: "blockTitle" }, ...contentBlocks(content.debtDataStore?.[debt])]) : [{ text: "Không ghi nhận chỉ số nợ nghiệp nổi bật trong hồ sơ này.", style: "paragraph" }]),
    subsection("12. Bài Học Đường Đời (Điểm Yếu)", "", "section-12"),
    definition(report.definitions?.karmicLessons),
    ...(lessons.length ? lessons.flatMap((lesson) => [{ text: `Bài học thiếu số ${lesson}`, style: "blockTitle" }, ...contentBlocks(content.lessonDataStore?.[lesson])]) : [{ text: "Không ghi nhận bài học thiếu nổi bật trong biểu đồ tên.", style: "paragraph" }]),
    { text: "", pageBreak: "after" }
  ];
}

function directionSection(report, topTraits, topCareer) {
  const content = report.content || {};
  return [
    sectionTitle("III. Nhóm tính cách & định hướng"),
    subsection("13. Nhóm Tính Cách Bản Ngã", "", "section-13"),
    definition(report.definitions?.personalityGroup),
    percentTable(report.personalityStats || [], GOLD),
    ...topTraits.flatMap((trait) => [
      { text: `Tính cách: ${trait.label} (${trait.percent}%)`, style: "blockTitle" },
      ...contentBlocks(content.personalityChart?.meanings?.[trait.id] || content.personalityChart)
    ]),
    subsection("14. Tỉ Lệ Nhóm Ngành Phù Hợp", "", "section-14"),
    definition(report.definitions?.careerGroup),
    percentTable(report.careerStats || [], NAVY),
    ...topCareer.flatMap((career) => [
      { text: `Ngành phù hợp: ${career.label} (${career.percent}%)`, style: "blockTitle" },
      ...contentBlocks(content.careerChart?.meanings?.[career.id] || content.careerChart)
    ]),
    { text: "", pageBreak: "after" }
  ];
}

function timelineSection(report) {
  const content = report.content || {};
  const forecast = report.forecast || {};
  const yearLabels = ["Năm trước", "Hiện tại", "Năm tới"];
  const cycleList = [
    { id: 1, label: "Gieo Hạt", data: report.periodCycles?.c1 || {} },
    { id: 2, label: "Chín", data: report.periodCycles?.c2 || {} },
    { id: 3, label: "Thu Hoạch", data: report.periodCycles?.c3 || {} }
  ];

  return [
    sectionTitle("IV. Dòng thời gian - chu kỳ vận động"),
    subsection("15. Chu Kỳ Đường Đời", "", "section-15"),
    tableBlock(["Chu kỳ", "Số", "Độ tuổi", "Giai đoạn"], cycleList.map((cycle) => [`${cycle.id} - ${cycle.label}`, cycle.data.number || "", cycle.data.ageRange || "", cycle.data.yearRange || ""])),
    subsection("16. Chu Kỳ Vận Số 9 Năm", "", "section-16"),
    tableBlock(["Năm", "Vận số", "Vị trí"], safeArray(forecast.years).map((item, index) => [item.year, item.number, yearLabels[index] || ""])),
    subsection("17. Dự Báo Năm Cá Nhân", "", "section-17"),
    ...safeArray(forecast.years).flatMap((item, index) => [
      { text: `Năm ${item.year} - Vận niên số ${item.number} (${yearLabels[index] || ""})`, style: "blockTitle" },
      ...contentBlocks(content.yearDataStore?.[item.number])
    ]),
    subsection("18. Dự Báo Tháng Cá Nhân", "", "section-18"),
    ...safeArray(forecast.months).flatMap((item) => [
      { text: `Tháng ${item.month}/${item.year} - Vận số ${item.number}`, style: "blockTitle" },
      ...contentBlocks(content.monthDataStore?.[item.number])
    ])
  ];
}

function backCover(assets) {
  return [
    { text: "", pageBreak: "before" },
    {
      stack: [
        assets.logo ? { image: assets.logo, width: 105, alignment: "center", margin: [0, 0, 0, 36] } : {},
        { text: "Cảm ơn bạn đã lựa chọn Phở Gõ Tarot!", style: "backTitle" },
        {
          text: "Bản báo cáo Thần Số Học này được biên soạn với mong muốn mang đến cho bạn một tấm bản đồ thấu hiểu bản thân và định hướng tương lai.",
          style: "backParagraph"
        },
        {
          table: {
            widths: ["*"],
            body: [[{
              stack: [
                { text: "Bạn có đang gặp khúc mắc cần giải đáp?", style: "ctaTitle" },
                { text: "Thần số học giúp bạn hiểu bức tranh tổng thể, còn Tarot sẽ soi sáng những câu chuyện hiện tại. Hãy đặt lịch xem bài Tarot chuyên sâu để nhận lời khuyên chi tiết.", style: "paragraph" },
                { text: "Booking Xem Tarot", link: "https://m.me/phogotarot", style: "ctaLink" }
              ],
              margin: [20, 18, 20, 18]
            }]]
          },
          layout: cardLayout(),
          margin: [28, 24, 28, 24]
        },
        { text: "phogotarot.com  |  fb.com/phogotarot  |  @phogotarot", style: "muted", alignment: "center" }
      ],
      margin: [0, 160, 0, 0]
    }
  ];
}

function sectionTitle(text) {
  return { text, style: "sectionTitle" };
}

function subsection(label, value, id) {
  return {
    stack: [
      { text: value ? `${label}: ${value}` : label, style: "subsectionTitle", id, tocItem: true }
    ],
    margin: [0, 12, 0, 6]
  };
}

function definition(text) {
  if (!text) return {};
  return { text, style: "definition" };
}

function renderCell(number, countsArray = []) {
  const count = countsArray[number - 1];
  return count ? String(number).repeat(count) : "";
}

function numerologyGrid(countsArray = [], title = "") {
  const nums = [3, 6, 9, 2, 5, 8, 1, 4, 7];
  const body = [0, 1, 2].map((row) => nums.slice(row * 3, row * 3 + 3).map((num) => ({
    text: renderCell(num, countsArray),
    style: "gridCell"
  })));

  return {
    stack: [
      title ? { text: title, style: "miniTitle", alignment: "center" } : {},
      {
        table: { widths: [52, 52, 52], heights: [44, 44, 44], body },
        layout: {
          hLineColor: () => GOLD,
          vLineColor: () => GOLD,
          hLineWidth: () => 0.8,
          vLineWidth: () => 0.8
        },
        alignment: "center",
        margin: [0, 4, 0, 12]
      }
    ]
  };
}

function chartDetails(title, arrows = [], missingNums = []) {
  const rows = [
    ...safeArray(arrows).map((arrow) => [arrow.type === "present" ? "Mũi tên hiện diện" : "Mũi tên thiếu", arrow.name || arrow.id || ""]),
    ...safeArray(missingNums).map((num) => ["Số thiếu", String(num)])
  ];
  if (!rows.length) return {};
  return [
    { text: title, style: "blockTitle" },
    tableBlock(["Loại", "Chi tiết"], rows)
  ];
}

function pyramidTable(pyramid) {
  const peaks = pyramid.peaks || {};
  const challenges = pyramid.challenges || {};
  return tableBlock(
    ["Vị trí", "Đỉnh cao", "Thử thách"],
    [
      ["Giai đoạn 1", peaks.p1 || "", challenges.c1 ?? ""],
      ["Giai đoạn 2", peaks.p2 || "", challenges.c2 ?? ""],
      ["Giai đoạn 3", peaks.p3 || "", challenges.c3 ?? ""],
      ["Giai đoạn 4", peaks.p4 || "", challenges.c4 ?? ""]
    ]
  );
}

function percentTable(items = [], color = GOLD) {
  return {
    table: {
      widths: ["*", 60],
      body: safeArray(items).map((item) => [
        {
          stack: [
            { text: item.label || item.id || "", style: "tableText" },
            {
              canvas: [
                { type: "rect", x: 0, y: 2, w: 320, h: 7, color: "#eee4d0" },
                { type: "rect", x: 0, y: 2, w: Math.max(0, Math.min(320, 320 * ((item.percent || 0) / 100))), h: 7, color }
              ],
              margin: [0, 3, 0, 0]
            }
          ]
        },
        { text: `${item.percent || 0}%`, style: "tableText", alignment: "right" }
      ])
    },
    layout: cardLayout(),
    margin: [0, 6, 0, 14]
  };
}

function tableBlock(headers, rows) {
  return {
    table: {
      headerRows: 1,
      widths: headers.map(() => "*"),
      body: [
        headers.map((header) => ({ text: String(header), style: "tableHeader" })),
        ...safeArray(rows).map((row) => row.map((cell) => ({ text: String(cell ?? ""), style: "tableText" })))
      ]
    },
    layout: cardLayout(),
    margin: [0, 6, 0, 14]
  };
}

function twoColumns(left, right) {
  return {
    columns: [
      { width: "*", stack: [left] },
      { width: "*", stack: [right] }
    ],
    columnGap: 18
  };
}

function fullPageImage(image) {
  if (!image) return { canvas: [{ type: "rect", x: 0, y: 0, w: A4.width, h: A4.height, color: PAPER }] };
  return { image, width: A4.width, height: A4.height, absolutePosition: { x: 0, y: 0 } };
}

function cardLayout() {
  return {
    fillColor: (rowIndex) => (rowIndex === 0 ? "#fffdf7" : null),
    hLineColor: () => LINE,
    vLineColor: () => LINE,
    hLineWidth: () => 0.6,
    vLineWidth: () => 0.6,
    paddingLeft: () => 8,
    paddingRight: () => 8,
    paddingTop: () => 7,
    paddingBottom: () => 7
  };
}

function styles() {
  return {
    coverTitle: { fontSize: 40, bold: true, alignment: "center", color: NAVY, lineHeight: 1.05, margin: [0, 0, 0, 20] },
    coverName: { fontSize: 22, bold: true, alignment: "center", color: NAVY, margin: [0, 0, 0, 8] },
    coverNote: { fontSize: 9, alignment: "center", color: "#5c6470" },
    metaLabel: { fontSize: 8.5, color: "#5c6470" },
    metaValue: { fontSize: 13, bold: true, color: NAVY },
    pageTitle: { fontSize: 27, bold: true, color: NAVY, margin: [0, 0, 0, 24] },
    sectionTitle: { fontSize: 22, bold: true, color: NAVY, margin: [0, 0, 0, 16] },
    subsectionTitle: { fontSize: 17, bold: true, color: NAVY },
    tocGroup: { fontSize: 14.5, bold: true, color: GOLD, margin: [0, 10, 0, 5] },
    tocNumber: { fontSize: 13, bold: true, color: GOLD, margin: [0, 2, 0, 2] },
    tocItem: { fontSize: 13, color: INK, margin: [0, 2, 0, 2] },
    definition: { fontSize: 12, italics: true, color: MUTED, margin: [0, 0, 0, 10] },
    paragraph: { fontSize: 13.2, color: INK, margin: [0, 0, 0, 10] },
    blockTitle: { fontSize: 15, bold: true, color: GOLD, margin: [0, 14, 0, 8] },
    quote: { fontSize: 12.8, italics: true, color: "#3f4857", margin: [12, 4, 12, 8] },
    muted: { fontSize: 12, color: MUTED, margin: [0, 0, 0, 8] },
    miniTitle: { fontSize: 12.5, bold: true, color: GOLD, margin: [0, 0, 0, 4] },
    gridCell: { fontSize: 16, bold: true, color: NAVY, alignment: "center", margin: [0, 12, 0, 0] },
    tableHeader: { fontSize: 11.5, bold: true, color: NAVY, fillColor: SOFT },
    tableText: { fontSize: 11.5, color: INK },
    footerText: { fontSize: 9.5, italics: true, color: MUTED },
    backTitle: { fontSize: 23, bold: true, alignment: "center", color: NAVY, margin: [0, 0, 0, 18] },
    backParagraph: { fontSize: 11, alignment: "center", color: INK, margin: [28, 0, 28, 0] },
    ctaTitle: { fontSize: 13, bold: true, color: NAVY, margin: [0, 0, 0, 8] },
    ctaLink: { fontSize: 12, bold: true, color: GOLD, decoration: "underline", alignment: "center", margin: [0, 8, 0, 0] }
  };
}
