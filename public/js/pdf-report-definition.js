(function () {
  "use strict";
  var contentBlocks = window.__pdfContentNormalizer.contentBlocks;
  var safeArray = window.__pdfContentNormalizer.safeArray;

const GOLD = "#c7972f";
const NAVY = "#0b132b";
const INK = "#1f2633";
const MUTED = "#667085";
const LINE = "#e8dcc4";
const PAPER = "#fffaf0";
const SOFT = "#f7efe0";
const A4 = { width: 595.28, height: 841.89 };

async function buildPdfDefinition(report, assets = {}) {
  const now = new Date().toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  const input = report.input || {};
  const displayName = titleCaseName(input.fullName || "");
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

  sections.push(coverPage(input, now, assets, displayName));
  sections.push(tocPage(numbers));
  sections.push(coreSection(report));
  sections.push(chartSection(report));
  sections.push(directionSection(report, topTraits, topCareer));
  sections.push(timelineSection(report));
  sections.push(backCover(assets));

  return {
    pageSize: "A4",
    pageMargins: [54, 62, 54, 58],
    info: {
      title: `Báo cáo Thần Số Học - ${displayName}`,
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
      const pageLabel = String(currentPage).padStart(2, "0");
      const footerName = displayName || "Phở Gõ Tarot";
      const footerDob = input.formattedDob || input.dobStr || "";
      return {
        margin: [36, 24, 36, 0],
        columns: [
          {
            width: "*",
            text: `© Copyright 2026 - phogotarot.com - ${footerName}${footerDob ? ` - ${footerDob}` : ""}`,
            style: "footerText"
          },
          { width: 38, text: pageLabel, alignment: "right", style: "footerText" }
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

function coverPage(input, generatedAt, assets, displayName) {
  return [
    {
      stack: [
        assets.logo ? { image: assets.logo, width: 100, alignment: "center", margin: [0, 0, 0, 104] } : {},
        { text: "BÁO CÁO", style: "coverTitleTop" },
        { text: "THẦN SỐ HỌC", style: "coverTitleMain" },
        coverDivider(),
        { text: displayName || "Bạn Mình", style: "coverName" },
        {
          margin: [52, 18, 52, 0],
          columns: [
            metaBox("Ngày sinh", input.formattedDob || input.dobStr || "", "left"),
            metaBox("Ngày xuất", generatedAt, "right")
          ]
        },
        { text: "© Copyright 2026 - phogotarot.com.", style: "coverNote", margin: [0, 204, 0, 0] }
      ],
      pageBreak: "after",
      margin: [0, 40, 0, 0]
    }
  ];
}

function coverDivider() {
  return {
    canvas: [
      { type: "line", x1: 0, y1: 0, x2: 94, y2: 0, lineWidth: 0.75, lineColor: "#b9aa88" },
      { type: "ellipse", x: 112, y: 0, r1: 3, r2: 3, color: "#b9aa88" },
      { type: "line", x1: 130, y1: 0, x2: 224, y2: 0, lineWidth: 0.75, lineColor: "#b9aa88" }
    ],
    width: 224,
    alignment: "center",
    margin: [0, -8, 0, 18]
  };
}

function metaBox(label, value, alignment = "left") {
  return {
    width: "*",
    margin: [10, 0, 10, 0],
    table: {
      widths: ["*"],
      body: [[
        {
          stack: [
            { text: label.toUpperCase(), style: "metaLabel", alignment },
            { text: value, style: "metaValue", alignment }
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

function tocPage(numbers = {}) {
  const groups = [
    {
      title: "I. NỀN TẢNG CỐT LÕI",
      items: [
        [`1.  Số chủ đạo của bạn: Số ${numbers.lifePath || ""}`, "section-1"],
        [`2.  Số Sứ Mệnh của bạn: Số ${numbers.destiny || ""}`, "section-2"],
        [`3.  Số Linh Hồn của bạn: Số ${numbers.soul || ""}`, "section-3"],
        [`4.  Số Nhân Cách của bạn: Số ${numbers.personality || ""}`, "section-4"],
        [`5.  Số Thái Độ của bạn: Số ${numbers.attitude || ""}`, "section-5"],
        [`6.  Số Tư Duy của bạn: Số ${numbers.rational || ""}`, "section-6"],
        [`7.  Số Trưởng Thành của bạn: Số ${numbers.maturity || ""}`, "section-7"]
      ]
    },
    {
      title: "II. BIỂU ĐỒ & CẤU TRÚC",
      items: [
        ["8.  Biểu Đồ Ngày Sinh", "section-8"],
        ["9.  Biểu Đồ Tên & Tổng Hợp", "section-9"],
        ["10.  Kim Tự Tháp Thần Số", "section-10"],
        ["11.  Chỉ Số Nợ Nghiệp", "section-11"],
        ["12.  Bài Học Đường Đời (Điểm Yếu)", "section-12"]
      ]
    },
    {
      title: "III. NHÓM TÍNH CÁCH & ĐỊNH HƯỚNG",
      items: [
        ["13.  Nhóm Tính Cách Bản Ngã", "section-13"],
        ["14.  Tỉ Lệ Nhóm Ngành Phù Hợp", "section-14"]
      ]
    },
    {
      title: "IV. DÒNG THỜI GIAN - CHU KỲ VẬN ĐỘNG",
      items: [
        ["15.  Chu Kỳ Đường Đời", "section-15"],
        ["16.  Chu Kỳ Vận Số 9 Năm", "section-16"],
        ["17.  Dự Báo Năm Cá Nhân", "section-17"],
        ["18.  Dự Báo Tháng Cá Nhân", "section-18"]
      ]
    }
  ];

  return [
    { text: "Mục lục báo cáo", style: "tocTitle" },
    ...groups.flatMap((group) => [
      { text: group.title, style: "tocMajor" },
      {
        table: {
          widths: ["*", 42],
          body: group.items.map(([label, destination]) => [
            { text: label, linkToDestination: destination, style: "tocCustomItem" },
            { text: "", pageReference: destination, linkToDestination: destination, style: "tocPageNumber" }
          ])
        },
        layout: tocLineLayout(),
        margin: [0, 0, 0, 13]
      }
    ]),
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
    centerBlock(numerologyGrid(chartData.strengthData)),
    chartDetails("Luận giải biểu đồ ngày sinh", chartData.strengthArrows, chartData.strengthMissingNums),
    ...chartInterpretations({
      title: "Tổng hợp luận giải biểu đồ ngày sinh",
      countsArray: chartData.strengthData,
      dataStore: content.strengthDataStore,
      arrowsList: chartData.strengthArrows,
      arrowStore: content.arrowStore,
      missingList: chartData.strengthMissingNums,
      missingStore: content.missingStore,
      chartType: "strength"
    }),
    subsection("9. Biểu Đồ Tên & Tổng Hợp", "", "section-9"),
    twoColumns(numerologyGrid(chartData.nameData, "Biểu đồ tên"), numerologyGrid(chartData.synthesisData, "Biểu đồ tổng hợp")),
    chartDetails("Luận giải biểu đồ tổng hợp", chartData.synthesisArrows, chartData.synthesisMissingNums),
    ...chartInterpretations({
      title: "Tổng hợp luận giải biểu đồ tổng hợp",
      countsArray: chartData.synthesisData,
      dataStore: content.synthesisDataStore,
      arrowsList: chartData.synthesisArrows,
      arrowStore: content.arrowStore,
      missingList: chartData.synthesisMissingNums,
      missingStore: content.missingStore,
      chartType: "synthesis"
    }),
    subsection("10. Kim Tự Tháp Thần Số", "", "section-10"),
    definition(report.definitions?.pyramid),
    pyramidGraphic(report),
    ...pyramidStageInterpretations(pyramid, content.pyramidDataStore),
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
  const personalityFallback = fallbackPersonalityMeanings();
  const careerFallback = fallbackCareerMeanings();
  return [
    sectionTitle("III. Nhóm tính cách & định hướng"),
    subsection("13. Nhóm Tính Cách Bản Ngã", "", "section-13"),
    definition(report.definitions?.personalityGroup),
    percentTable(report.personalityStats || [], GOLD),
    ...topTraits.flatMap((trait) => [
      { text: `Tính cách: ${trait.label} (${trait.percent}%)`, style: "blockTitle" },
      ...contentBlocks(content.personalityChart?.meanings?.[trait.id] || personalityFallback[String(trait.id)] || content.personalityChart)
    ]),
    subsection("14. Tỉ Lệ Nhóm Ngành Phù Hợp", "", "section-14"),
    definition(report.definitions?.careerGroup),
    percentTable(report.careerStats || [], NAVY),
    ...topCareer.flatMap((career) => [
      { text: `Ngành phù hợp: ${career.label} (${career.percent}%)`, style: "blockTitle" },
      ...contentBlocks(content.careerChart?.meanings?.[career.id] || careerFallback[career.id] || content.careerChart)
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
    lifeCycleCards(cycleList),
    definition(report.definitions?.periodCycles),
    ...cycleList.flatMap((cycle) => [
      { text: `Luận giải Chu kỳ ${cycle.id} (Số ${cycle.data.number || ""})`, style: "blockTitle" },
      ...contentBlocks(content.cyclesDataStore?.[cycle.data.number])
    ]),
    subsection("16. Chu Kỳ Vận Số 9 Năm", "", "section-16"),
    personalYearChart(forecast.years),
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
        assets.coverArtwork ? { image: assets.coverArtwork, width: A4.width, height: A4.height, absolutePosition: { x: 0, y: 0 } } : {},
        assets.logo ? { image: assets.logo, width: 105, alignment: "center", margin: [0, 0, 0, 36] } : {},
        { text: "Cảm ơn bạn đã lựa chọn Phở Gõ Tarot!", style: "backTitle" },
        {
          text: "Bản báo cáo Thần Số Học này được biên soạn với mong muốn mang đến cho bạn một tấm bản đồ toàn diện để thấu hiểu chính mình — từ tính cách cốt lõi, sứ mệnh cuộc đời, cho đến những chu kỳ vận số đang và sẽ ảnh hưởng đến hành trình phía trước. Hy vọng qua những phân tích này, bạn sẽ tìm thấy sự tự tin để đưa ra quyết định, nhận ra tiềm năng bên trong và sống đúng với phiên bản tốt nhất của chính mình.",
          style: "backParagraph"
        },
        backCoverDivider(),
        {
          stack: [
            { text: "Bạn có đang gặp khúc mắc cần giải đáp?", style: "ctaTitle", alignment: "center" },
            { text: "Thần số học giúp bạn hiểu bức tranh tổng thể, còn Tarot sẽ soi sáng những câu chuyện hiện tại. Hãy đặt lịch xem bài Tarot chuyên sâu để nhận lời khuyên chi tiết.", style: "backParagraph" },
            { text: "Booking Xem Tarot", link: "https://phogotarot.com/contact", style: "ctaLink" }
          ],
          margin: [28, 0, 28, 0]
        },
        backCoverDivider(),
        socialIconRow()
      ],
      margin: [0, 130, 0, 0]
    }
  ];
}

function backCoverDivider() {
  return {
    canvas: [
      { type: "line", x1: 0, y1: 0, x2: 160, y2: 0, lineWidth: 0.75, lineColor: "#b9aa88" },
      { type: "ellipse", x: 178, y: 0, r1: 3, r2: 3, color: "#b9aa88" },
      { type: "line", x1: 196, y1: 0, x2: 356, y2: 0, lineWidth: 0.75, lineColor: "#b9aa88" }
    ],
    width: 356,
    alignment: "center",
    margin: [0, 20, 0, 20]
  };
}

function socialIconRow() {
  const items = [
    { label: "Facebook", link: "https://www.facebook.com/phogotarot", svg: socialIconSvg("facebook") },
    { label: "YouTube", link: "https://www.youtube.com/@phogotarot", svg: socialIconSvg("youtube") },
    { label: "Instagram", link: "https://www.instagram.com/pho_go_tarot/", svg: socialIconSvg("instagram") },
    { label: "TikTok", link: "https://www.tiktok.com/@phogo_tarot", svg: socialIconSvg("tiktok") }
  ];
  const serviceLinks = [
    { text: "Xem tarot online", link: "https://phogotarot.com/xem-tarot" },
    { text: "Xem tarot Yes/No", link: "https://phogotarot.com/yes-no-reading" }
  ];

  return {
    stack: [
      { text: "Theo dõi Phở Gõ Tarot", style: "socialCaption" },
      {
        columns: [
          { width: "*", text: "" },
          ...items.map((item) => ({
            width: 58,
            stack: [
              { svg: item.svg, width: 22, height: 22, alignment: "center", link: item.link },
              { text: item.label, style: "socialLabel", link: item.link }
            ]
          })),
          { width: "*", text: "" }
        ],
        columnGap: 8,
        margin: [0, 8, 0, 0]
      },
      {
        text: serviceLinks.flatMap((item, index) => [
          index ? "  |  " : "",
          { text: item.text, link: item.link }
        ]),
        style: "serviceLinks",
        margin: [0, 16, 0, 0]
      }
    ],
    margin: [0, 8, 0, 0]
  };
}

function socialIconSvg(type) {
  const paths = {
    facebook: {
      viewBox: "0 0 512 512",
      path: "M512 256C512 114.6 397.4 0 256 0S0 114.6 0 256C0 376 82.7 476.8 194.2 504.5l0-170.3-52.8 0 0-78.2 52.8 0 0-33.7c0-87.1 39.4-127.5 125-127.5 16.2 0 44.2 3.2 55.7 6.4l0 70.8c-6-.6-16.5-1-29.6-1-42 0-58.2 15.9-58.2 57.2l0 27.8 83.6 0-14.4 78.2-69.3 0 0 175.9C413.8 494.8 512 386.9 512 256z"
    },
    youtube: {
      viewBox: "0 0 576 512",
      path: "M549.7 124.1C543.5 100.4 524.9 81.8 501.4 75.5 458.9 64 288.1 64 288.1 64S117.3 64 74.7 75.5C51.2 81.8 32.7 100.4 26.4 124.1 15 167 15 256.4 15 256.4s0 89.4 11.4 132.3c6.3 23.6 24.8 41.5 48.3 47.8 42.6 11.5 213.4 11.5 213.4 11.5s170.8 0 213.4-11.5c23.5-6.3 42-24.2 48.3-47.8 11.4-42.9 11.4-132.3 11.4-132.3s0-89.4-11.4-132.3zM232.2 337.6l0-162.4 142.7 81.2-142.7 81.2z"
    },
    instagram: {
      viewBox: "0 0 448 512",
      path: "M224.3 141a115 115 0 1 0-.6 230 115 115 0 1 0 .6-230zm-.6 40.4a74.6 74.6 0 1 1 .6 149.2 74.6 74.6 0 1 1-.6-149.2zm93.4-45.1a26.8 26.8 0 1 1 53.6 0 26.8 26.8 0 1 1-53.6 0zm129.7 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM399 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"
    },
    tiktok: {
      viewBox: "0 0 448 512",
      path: "M448.5 209.9c-44 .1-87-13.6-122.8-39.2l0 178.7c0 33.1-10.1 65.4-29 92.6s-45.6 48-76.6 59.6-64.8 13.5-96.9 5.3-60.9-25.9-82.7-50.8-35.3-56-39-88.9 2.9-66.1 18.6-95.2 40-52.7 69.6-67.7 62.9-20.5 95.7-16l0 89.9c-15-4.7-31.1-4.6-46 .4s-27.9 14.6-37 27.3-14 28.1-13.9 43.9 5.2 31 14.5 43.7 22.4 22.1 37.4 26.9 31.1 4.8 46-.1 28-14.4 37.2-27.1 14.2-28.1 14.2-43.8l0-349.4 88 0c-.1 7.4 .6 14.9 1.9 22.2 3.1 16.3 9.4 31.9 18.7 45.7s21.3 25.6 35.2 34.6c19.9 13.1 43.2 20.1 67 20.1l0 87.4z"
    }
  };
  const icon = paths[type] || paths.facebook;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${icon.viewBox}"><path fill="#746556" d="${icon.path}"/></svg>`;
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
  const body = [0, 1, 2].map((row) => nums.slice(row * 3, row * 3 + 3).map((num) => {
    const value = renderCell(num, countsArray);
    return {
      stack: [
        { text: value, style: "gridCell" }
      ],
      margin: [0, 23, 0, 0]
    };
  }));

  return {
    stack: [
      title ? { text: title, style: "miniTitle", alignment: "center" } : {},
      {
        table: { widths: [70, 70, 70], heights: [70, 70, 70], body },
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

function chartInterpretations({ title, countsArray = [], dataStore = {}, arrowsList = [], arrowStore = {}, missingList = [], missingStore = {} }) {
  const blocks = [{ text: title, style: "blockTitle" }];

  safeArray(countsArray).forEach((count, index) => {
    if (!count) return;
    const number = index + 1;
    const data = dataStore?.[number];
    if (!data) return;
    blocks.push({ text: data.title || `Số ${number}`, style: "miniSectionTitle" });
    blocks.push(...contentBlocks(data));
  });

  safeArray(arrowsList).forEach((arrow) => {
    const data = arrowStore?.[arrow.id]?.[arrow.type];
    if (!data) return;
    blocks.push({ text: data.title || (arrow.type === "present" ? "Mũi tên hiện diện" : "Mũi tên thiếu"), style: "miniSectionTitle" });
    blocks.push(...contentBlocks(data));
  });

  safeArray(missingList).forEach((number) => {
    const data = missingStore?.[number];
    if (!data) return;
    blocks.push({ text: `Thiếu số ${number}`, style: "miniSectionTitle" });
    blocks.push(...contentBlocks(data));
  });

  return blocks.length > 1 ? blocks : [{ text: "Không có thông tin nổi bật.", style: "muted" }];
}

function pyramidStageInterpretations(pyramid = {}, dataStore = {}) {
  const stages = [
    { id: 1, label: "Giai đoạn 1 (Tuổi trẻ)", peakKey: "p1", challengeKey: "c1", ageKey: "p1_text" },
    { id: 2, label: "Giai đoạn 2 (Trưởng thành)", peakKey: "p2", challengeKey: "c2", ageKey: "p2_text" },
    { id: 3, label: "Giai đoạn 3 (Trung niên)", peakKey: "p3", challengeKey: "c3", ageKey: "p3_text" },
    { id: 4, label: "Giai đoạn 4 (Viên mãn)", peakKey: "p4", challengeKey: "c4", ageKey: "p4_text" }
  ];

  return stages.flatMap((stage) => {
    const peak = pyramid.peaks?.[stage.peakKey];
    const challenge = pyramid.challenges?.[stage.challengeKey];
    const age = pyramid.ages?.[stage.ageKey] || "";
    const peakData = dataStore?.peaks?.[peak];
    const challengeData = dataStore?.challenges?.[challenge];
    const blocks = [
      {
        columns: [
          { text: stage.label, style: "pyramidStageTitle" },
          { text: age, style: "pyramidStageAge" }
        ],
        margin: [0, 18, 0, 8]
      }
    ];

    if (peak != null) {
      blocks.push({ text: `Đỉnh cao số ${peak}`, style: "miniSectionTitle" });
      blocks.push(...contentBlocks(peakData));
    }

    if (challenge != null) {
      blocks.push({ text: `Thử thách số ${challenge}`, style: "miniSectionTitle" });
      blocks.push(...contentBlocks(challengeData));
    }

    return blocks;
  });
}

function pyramidGraphic(report) {
  const pyramid = report.pyramid || {};
  const peaks = pyramid.peaks || {};
  const challenges = pyramid.challenges || {};
  const base = pyramid.base || {};
  const input = report.input || {};
  const ages = pyramid.ages || {};
  const ageLabel = (range, year, x, y, anchor = "middle") => `
    <text x="${x}" y="${y}" text-anchor="${anchor}" font-size="13" font-weight="700" fill="#2f3747">${escapeSvg(range)}</text>
    ${year ? `<text x="${x}" y="${y + 17}" text-anchor="${anchor}" font-size="12" font-weight="700" fill="#9a6b16">(${escapeSvg(year)})</text>` : ""}
  `;
  const svgNode = (x, y, value, fill = "#fffaf0", textColor = "#0b132b", glow = false) => `
    ${glow ? `<circle cx="${x}" cy="${y}" r="28" fill="#d4a33a" opacity="0.16"/>` : ""}
    <circle cx="${x}" cy="${y}" r="20" fill="${fill}" stroke="#c7972f" stroke-width="1.45"/>
    <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="15" font-weight="700" fill="${textColor}">${escapeSvg(value ?? "")}</text>
  `;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="420" height="560" viewBox="0 0 420 560">
    <rect width="420" height="560" fill="#fffaf0" opacity="0"/>
    <g stroke="#c7972f" stroke-width="1.25" opacity="0.86" fill="none">
      <line x1="210" y1="45" x2="78" y2="280"/>
      <line x1="210" y1="45" x2="342" y2="280"/>
      <line x1="78" y1="280" x2="210" y2="510"/>
      <line x1="342" y1="280" x2="210" y2="510"/>
      <line x1="78" y1="280" x2="342" y2="280" opacity="0.45"/>
      <line x1="152" y1="218" x2="210" y2="128"/>
      <line x1="268" y1="218" x2="210" y2="128"/>
      <line x1="152" y1="218" x2="78" y2="280"/>
      <line x1="268" y1="218" x2="342" y2="280"/>
      <line x1="152" y1="218" x2="210" y2="280"/>
      <line x1="268" y1="218" x2="210" y2="280"/>
      <line x1="210" y1="280" x2="152" y2="344"/>
      <line x1="210" y1="280" x2="268" y2="344"/>
      <line x1="152" y1="344" x2="210" y2="426"/>
      <line x1="268" y1="344" x2="210" y2="426"/>
    </g>
    <g stroke="#8a93a3" stroke-width="1.05" opacity="0.62" fill="none">
      <path d="M231 45 H322 L334 34"/>
      <path d="M231 128 H322 L334 117"/>
      <path d="M289 218 H352 L364 207"/>
      <path d="M131 218 H68 L56 207"/>
    </g>
    ${ageLabel(ages.p4_text || "48-56 tuổi", ages.p4_year || pyramid.years?.p4, 346, 36, "middle")}
    ${ageLabel(ages.p3_text || "39-47 tuổi", ages.p3_year || pyramid.years?.p3, 346, 108, "middle")}
    ${ageLabel(ages.p2_text || "30-38 tuổi", ages.p2_year || pyramid.years?.p2, 356, 202, "start")}
    ${ageLabel(ages.p1_text || "21-29 tuổi", ages.p1_year || pyramid.years?.p1, 64, 202, "end")}
    ${svgNode(210, 45, peaks.p4, "#0b132b", "#fffaf0")}
    ${svgNode(210, 128, peaks.p3, "#0b132b", "#fffaf0")}
    ${svgNode(152, 218, peaks.p1, "#0b132b", "#fffaf0")}
    ${svgNode(268, 218, peaks.p2, "#0b132b", "#fffaf0")}
    ${svgNode(78, 280, base.m ?? input.month)}
    ${svgNode(210, 280, base.d ?? input.day, "#fffaf0", "#9a6b16", true)}
    ${svgNode(342, 280, base.y ?? String(input.year || "").slice(-1))}
    ${svgNode(152, 344, challenges.c1, "#f2eadb", "#2f3747")}
    ${svgNode(268, 344, challenges.c2, "#f2eadb", "#2f3747")}
    ${svgNode(210, 426, challenges.c3, "#f2eadb", "#2f3747")}
    ${svgNode(210, 510, challenges.c4, "#f2eadb", "#2f3747")}
    <text x="78" y="314" text-anchor="middle" font-size="12" fill="#667085">Tháng ${escapeSvg(input.month || "")}</text>
    <text x="210" y="314" text-anchor="middle" font-size="12" font-weight="700" fill="#9a6b16">Ngày ${escapeSvg(input.day || "")}</text>
    <text x="342" y="314" text-anchor="middle" font-size="12" fill="#667085">Năm ${escapeSvg(input.year || "")}</text>
  </svg>`;

  return {
    stack: [
      { svg, width: 360, alignment: "center", margin: [0, 8, 0, 8] }
    ],
    alignment: "center",
    margin: [0, 6, 0, 14]
  };
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

function lifeCycleCards(cycles = []) {
  return {
    columns: safeArray(cycles).map((cycle) => ({
      width: "*",
      table: {
        widths: ["*"],
        body: [[{
          stack: [
            { text: `Chu kỳ ${cycle.id}`, style: "cycleEyebrow" },
            { text: cycle.label, style: "cycleTitle" },
            { text: String(cycle.data?.number || ""), style: "cycleNumber" },
            { text: cycle.data?.ageRange || "", style: "cycleMeta" },
            { text: cycle.data?.yearRange || "", style: "cycleMeta" }
          ],
          margin: [12, 12, 12, 12]
        }]]
      },
      layout: cycleCardLayout()
    })),
    columnGap: 12,
    margin: [0, 8, 0, 16]
  };
}

function personalYearChart(years = []) {
  const items = buildNineYearSeries(years);
  const chart = {
    width: 500,
    height: 230,
    left: 36,
    right: 464,
    top: 34,
    bottom: 156
  };
  const step = (chart.right - chart.left) / Math.max(1, items.length - 1);
  const waveHeights = { 1: 8, 2: 4, 3: 5, 4: 1, 5: 6, 6: 7, 7: 2, 8: 9, 9: 10 };
  const points = items.map((item, index) => ({
    ...item,
    x: chart.left + step * index,
    waveHeight: waveHeights[item.number] || item.number,
    y: chart.bottom - (((waveHeights[item.number] || item.number) - 1) / 9) * (chart.bottom - chart.top)
  }));
  const baseY = chart.bottom + 10;
  const curve = catmullRomPath(points, 0.72);
  const area = `${curve} L ${points[points.length - 1].x.toFixed(2)} ${baseY} L ${points[0].x.toFixed(2)} ${baseY} Z`;
  const current = points.find((item) => item.isCurrent) || points[Math.floor(points.length / 2)];
  const markerNodes = points.map((point) => {
    const radius = point.isCurrent ? 5.5 : 4.2;
    const fill = point.isCurrent ? "#fffaf0" : "#0b132b";
    const strokeWidth = point.isCurrent ? 2.2 : 1.8;
    return `
      <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="${radius}" fill="${fill}" stroke="#c7972f" stroke-width="${strokeWidth}"/>
      <text x="${point.x.toFixed(2)}" y="${(point.y - 11).toFixed(2)}" text-anchor="middle" font-size="11" font-weight="700" fill="#0b132b">${point.number}</text>
      <text x="${point.x.toFixed(2)}" y="190" text-anchor="middle" font-size="10.5" fill="#667085">${point.year}</text>
    `;
  }).join("");
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="${chart.width}" height="${chart.height}" viewBox="0 0 ${chart.width} ${chart.height}">
    <rect x="8" y="8" width="484" height="214" rx="12" fill="#fffdf7" stroke="#e3d2ad" stroke-width="1"/>
    <path d="${area}" fill="#eadfca" opacity="0.58"/>
    <path d="${curve}" fill="none" stroke="#c7972f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    ${markerNodes}
    <circle cx="34" cy="212" r="3.2" fill="#c7972f"/>
    <text x="44" y="216" font-size="12.5" fill="#2f3747">Năm hiện tại của bạn: </text>
    <text x="176" y="216" font-size="12.5" font-weight="700" fill="#9a6b16">Số ${escapeSvg(current?.number || "")}</text>
  </svg>`;

  return {
    svg,
    width: 500,
    alignment: "center",
    margin: [0, 8, 0, 16]
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

function centerBlock(block) {
  return {
    columns: [
      { width: "*", text: "" },
      { width: "auto", stack: [block] },
      { width: "*", text: "" }
    ]
  };
}

function buildNineYearSeries(years = []) {
  const source = safeArray(years);
  const current = source[1] || source[0] || { year: new Date().getFullYear(), number: 1 };
  const currentYear = Number(current.year) || new Date().getFullYear();
  const currentNumber = Number(current.number) || 1;
  return Array.from({ length: 9 }, (_, index) => {
    const offset = index - 4;
    return {
      year: currentYear + offset,
      number: normalizeCycleNumber(currentNumber + offset),
      isCurrent: offset === 0
    };
  });
}

function normalizeCycleNumber(value) {
  const number = Number(value) || 1;
  return ((number - 1) % 9 + 9) % 9 + 1;
}

function catmullRomPath(points = [], tension = 0.4) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  const commands = [`M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`];

  for (let index = 0; index < points.length - 1; index++) {
    const previous = points[index - 1] || points[index];
    const current = points[index];
    const next = points[index + 1];
    const after = points[index + 2] || next;
    const c1x = current.x + (next.x - previous.x) * tension / 6;
    const c1y = current.y + (next.y - previous.y) * tension / 6;
    const c2x = next.x - (after.x - current.x) * tension / 6;
    const c2y = next.y - (after.y - current.y) * tension / 6;
    commands.push([
      "C",
      c1x.toFixed(2),
      c1y.toFixed(2),
      c2x.toFixed(2),
      c2y.toFixed(2),
      next.x.toFixed(2),
      next.y.toFixed(2)
    ].join(" "));
  }

  return commands.join(" ");
}

function escapeSvg(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function titleCaseName(value) {
  return String(value || "")
    .trim()
    .toLocaleLowerCase("vi-VN")
    .replace(/(^|[\s'-])(\p{L})/gu, (_, prefix, letter) => `${prefix}${letter.toLocaleUpperCase("vi-VN")}`);
}

function textData(content) {
  return { rawContent: content };
}

function fallbackPersonalityMeanings() {
  return {
    1: textData("Bạn nổi bật với tinh thần độc lập, khả năng tự quyết và xu hướng chủ động dẫn dắt tình huống. Khi năng lượng này cân bằng, bạn dễ trở thành người mở đường, dám chịu trách nhiệm và truyền cảm hứng bằng sự tự tin."),
    2: textData("Bạn có thế mạnh về sự tinh tế, khả năng lắng nghe và cảm nhận bầu không khí xung quanh. Nhóm tính cách này giúp bạn kết nối, hòa giải và nhận ra những chi tiết cảm xúc mà người khác dễ bỏ qua."),
    3: textData("Bạn mang màu sắc sáng tạo, hoạt bát và có khả năng biểu đạt tốt. Khi được đặt trong môi trường phù hợp, bạn dễ lan tỏa sự vui vẻ, ý tưởng mới và tinh thần lạc quan."),
    4: textData("Bạn thiên về sự thực tế, cẩn trọng và thích xây dựng mọi thứ theo nền tảng chắc chắn. Đây là nhóm tính cách mạnh về tổ chức, quy trình và độ tin cậy."),
    5: textData("Bạn có nhu cầu trải nghiệm, học nhanh và thích sự linh hoạt. Năng lượng này giúp bạn thích nghi tốt, tò mò và dễ nhìn thấy nhiều lựa chọn trong một vấn đề."),
    6: textData("Bạn có xu hướng quan tâm, bảo vệ và đặt trách nhiệm với người thân hoặc cộng đồng lên cao. Đây là nhóm tính cách giàu tình cảm, đáng tin và biết tạo cảm giác an toàn."),
    7: textData("Bạn thiên về chiều sâu, quan sát, phân tích và tìm kiếm bản chất phía sau sự việc. Nhóm tính cách này phù hợp với học hỏi, nghiên cứu và những không gian cần sự tập trung."),
    8: textData("Bạn có năng lượng kỷ luật, định hướng kết quả và cảm quan mạnh về công bằng, hiệu quả. Khi phát huy tốt, bạn biết quản trị nguồn lực, đặt mục tiêu rõ và kiên trì với tiêu chuẩn cao."),
    9: textData("Bạn có màu sắc bao dung, lý tưởng và dễ nhìn vấn đề bằng góc nhìn rộng. Nhóm tính cách này giúp bạn thấu hiểu, truyền cảm hứng và quan tâm đến giá trị lớn hơn lợi ích trước mắt.")
  };
}

function fallbackCareerMeanings() {
  return {
    management: textData("Bạn phù hợp với các vai trò cần định hướng, ra quyết định, phát triển kinh doanh hoặc dẫn dắt đội nhóm. Nhóm này phát huy tốt khi bạn có quyền chủ động, mục tiêu rõ và không gian để biến ý tưởng thành kết quả."),
    business: textData("Bạn hợp với các công việc cần sự ổn định, quy trình, số liệu, vận hành, hành chính, tài chính hoặc quản trị chi tiết. Điểm mạnh là tính cẩn thận, khả năng duy trì hệ thống và làm việc đáng tin cậy."),
    technical: textData("Bạn có độ phù hợp cao với nhóm kỹ thuật, công nghệ, vận hành thực tế, công cụ, dữ liệu hoặc các công việc cần tư duy xử lý vấn đề. Môi trường phù hợp là nơi coi trọng năng lực thật và logic."),
    research: textData("Bạn phù hợp với các hướng nghiên cứu, phân tích, giáo dục, tư vấn chuyên sâu, dữ liệu hoặc những lĩnh vực cần đào sâu bản chất. Điểm mạnh là khả năng quan sát, tìm mẫu hình và kiên nhẫn với vấn đề phức tạp."),
    social: textData("Bạn hợp với các công việc liên quan đến con người như chăm sóc khách hàng, đào tạo, nhân sự, tư vấn, cộng đồng hoặc dịch vụ hỗ trợ. Nhóm này phát huy khi bạn được kết nối và tạo giá trị trực tiếp cho người khác."),
    artistic: textData("Bạn phù hợp với các lĩnh vực sáng tạo, truyền thông, nội dung, nghệ thuật, thiết kế, biểu đạt cá nhân hoặc những công việc cần ý tưởng mới. Môi trường lý tưởng là nơi tôn trọng cá tính và cho phép thử nghiệm.")
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

function cycleCardLayout() {
  return {
    fillColor: () => "#fffdf7",
    hLineColor: () => "#d9b76a",
    vLineColor: () => "#d9b76a",
    hLineWidth: () => 0.8,
    vLineWidth: () => 0.8,
    paddingLeft: () => 0,
    paddingRight: () => 0,
    paddingTop: () => 0,
    paddingBottom: () => 0
  };
}

function tocLineLayout() {
  return {
    hLineColor: () => "#dfcfaa",
    vLineColor: () => "#ffffff",
    hLineWidth: () => 0,
    vLineWidth: () => 0,
    paddingLeft: () => 20,
    paddingRight: () => 0,
    paddingTop: () => 6,
    paddingBottom: () => 6
  };
}

function styles() {
  return {
    coverTitleTop: { font: "PlayfairDisplay", fontSize: 35, bold: false, alignment: "center", color: "#272525", lineHeight: 0.92, characterSpacing: 1.4, margin: [0, 0, 0, 10] },
    coverTitleMain: { font: "PlayfairDisplay", fontSize: 48, bold: false, alignment: "center", color: "#272525", lineHeight: 0.92, characterSpacing: 1.2, margin: [0, 0, 0, 24] },
    coverName: { font: "PlayfairDisplay", fontSize: 25, bold: false, alignment: "center", color: "#746556", margin: [0, 0, 0, 8] },
    coverNote: { fontSize: 9, alignment: "center", color: "#5c6470" },
    metaLabel: { fontSize: 9.5, color: "#5c6470" },
    metaValue: { fontSize: 15, bold: true, color: "#746556" },
    pageTitle: { fontSize: 27, bold: true, color: NAVY, margin: [0, 0, 0, 24] },
    tocTitle: { fontSize: 27, bold: true, color: "#8a5a10", margin: [0, 0, 0, 18] },
    tocMajor: { fontSize: 14.5, bold: true, color: "#8a5a10", margin: [0, 4, 0, 6] },
    tocCustomItem: { fontSize: 12.8, color: INK, margin: [0, 0, 0, 0] },
    tocPageNumber: { fontSize: 12.8, color: "#8a5a10", alignment: "right" },
    sectionTitle: { fontSize: 22, bold: true, color: NAVY, margin: [0, 0, 0, 16] },
    subsectionTitle: { fontSize: 17, bold: true, color: NAVY },
    tocGroup: { fontSize: 14.5, bold: true, color: GOLD, margin: [0, 10, 0, 5] },
    tocNumber: { fontSize: 13, bold: true, color: GOLD, margin: [0, 2, 0, 2] },
    tocItem: { fontSize: 13, color: INK, margin: [0, 2, 0, 2] },
    definition: { fontSize: 12, italics: true, color: MUTED, margin: [0, 0, 0, 10] },
    paragraph: { fontSize: 13.2, color: INK, margin: [0, 0, 0, 10] },
    blockTitle: { fontSize: 15, bold: true, color: GOLD, margin: [0, 14, 0, 8] },
    miniSectionTitle: { fontSize: 13.5, bold: true, color: NAVY, margin: [0, 10, 0, 6] },
    pyramidStageTitle: { fontSize: 15.5, bold: true, color: GOLD },
    pyramidStageAge: { fontSize: 11.5, italics: true, color: MUTED, alignment: "right" },
    quoteText: { fontSize: 12.8, italics: true, color: "#3f4857", lineHeight: 1.35 },
    muted: { fontSize: 12, color: MUTED, margin: [0, 0, 0, 8] },
    miniTitle: { fontSize: 12.5, bold: true, color: GOLD, margin: [0, 0, 0, 4] },
    gridCell: { fontSize: 16, bold: true, color: NAVY, alignment: "center", margin: [0, 0, 0, 0] },
    tableHeader: { fontSize: 11.5, bold: true, color: NAVY, fillColor: SOFT },
    tableText: { fontSize: 11.5, color: INK },
    cycleEyebrow: { fontSize: 10.5, bold: true, color: GOLD, alignment: "center", margin: [0, 0, 0, 3] },
    cycleTitle: { fontSize: 13, bold: true, color: NAVY, alignment: "center", margin: [0, 0, 0, 8] },
    cycleNumber: { fontSize: 28, bold: true, color: "#9a6b16", alignment: "center", margin: [0, 0, 0, 8] },
    cycleMeta: { fontSize: 10.5, color: MUTED, alignment: "center", margin: [0, 1, 0, 0] },
    footerText: { fontSize: 9.5, italics: true, color: MUTED },
    backTitle: { font: "PlayfairDisplay", fontSize: 25, bold: false, alignment: "center", color: "#272525", lineHeight: 1.08, characterSpacing: 0.4, margin: [0, 0, 0, 18] },
    backParagraph: { fontSize: 11, alignment: "center", color: INK, margin: [28, 0, 28, 0] },
    socialCaption: { fontSize: 11.5, bold: true, color: "#746556", alignment: "center" },
    socialLabel: { fontSize: 8.2, color: "#746556", alignment: "center", margin: [0, 4, 0, 0] },
    serviceLinks: { fontSize: 10.5, bold: true, color: GOLD, alignment: "center", decoration: "underline" },
    ctaTitle: { fontSize: 13, bold: true, color: NAVY, margin: [0, 0, 0, 8] },
    ctaLink: { fontSize: 12, bold: true, color: GOLD, decoration: "underline", alignment: "center", margin: [0, 8, 0, 0] }
  };
}


  window.__pdfReportDefinition = { buildPdfDefinition: buildPdfDefinition };
})();

