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
      const pageLabel = `${String(currentPage).padStart(2, "0")} / ${String(pageCount).padStart(2, "0")}`;
      const footerName = displayName || "Phở Gõ Tarot";
      const footerDob = input.formattedDob || input.dobStr || "";
      return {
        margin: [36, 24, 36, 0],
        columns: [
          {
            text: `© Copyright 2026 - ${footerName}${footerDob ? ` - ${footerDob}` : ""}`,
            style: "footerText"
          },
          { text: pageLabel, alignment: "right", style: "footerText" }
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
        { text: displayName || "Bạn Mình", style: "coverName" },
        {
          margin: [52, 34, 52, 0],
          columns: [
            metaBox("Ngày sinh", input.formattedDob || input.dobStr || ""),
            metaBox("Ngày xuất", generatedAt)
          ]
        },
        { text: "Copyright 2026 - phogotarot.com.", style: "coverNote", width: A4.width, absolutePosition: { x: 0, y: 786 } }
      ],
      pageBreak: "after",
      margin: [0, 40, 0, 0]
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
    subsection("9. Biểu Đồ Tên & Tổng Hợp", "", "section-9"),
    twoColumns(numerologyGrid(chartData.nameData, "Biểu đồ tên"), numerologyGrid(chartData.synthesisData, "Biểu đồ tổng hợp")),
    chartDetails("Luận giải biểu đồ tổng hợp", chartData.synthesisArrows, chartData.synthesisMissingNums),
    subsection("10. Kim Tự Tháp Thần Số", "", "section-10"),
    definition(report.definitions?.pyramid),
    pyramidGraphic(report),
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
        {
          text: [
            { text: "Xem trải bài online", link: "https://phogotarot.com/xem-tarot" },
            "  |  ",
            { text: "Facebook", link: "https://www.facebook.com/phogotarot" },
            "  |  ",
            { text: "YouTube", link: "https://www.youtube.com/@phogotarot" },
            "\n",
            { text: "Instagram", link: "https://www.instagram.com/pho_go_tarot/" },
            "  |  ",
            { text: "TikTok", link: "https://www.tiktok.com/@phogo_tarot" }
          ],
          style: "socialLinks",
          alignment: "center"
        }
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

function pyramidGraphic(report) {
  const pyramid = report.pyramid || {};
  const peaks = pyramid.peaks || {};
  const challenges = pyramid.challenges || {};
  const input = report.input || {};
  const svgNode = (x, y, value, fill = "#0b132b") => `
    <circle cx="${x}" cy="${y}" r="18" fill="${fill}" stroke="${GOLD}" stroke-width="2"/>
    <text x="${x}" y="${y + 5}" text-anchor="middle" font-size="16" font-weight="700" fill="#ffffff">${escapeSvg(value ?? "")}</text>
  `;
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" width="420" height="430" viewBox="0 0 420 430">
    <rect width="420" height="430" fill="#fffaf0" opacity="0"/>
    <g stroke="${GOLD}" stroke-width="1.4" opacity="0.95">
      <line x1="210" y1="25" x2="92" y2="205"/>
      <line x1="210" y1="25" x2="328" y2="205"/>
      <line x1="92" y1="205" x2="210" y2="365"/>
      <line x1="328" y1="205" x2="210" y2="365"/>
      <line x1="92" y1="205" x2="328" y2="205"/>
      <line x1="210" y1="25" x2="210" y2="365" opacity="0.65"/>
      <line x1="150" y1="155" x2="210" y2="92" opacity="0.65"/>
      <line x1="270" y1="155" x2="210" y2="92" opacity="0.65"/>
      <line x1="150" y1="155" x2="92" y2="205" opacity="0.65"/>
      <line x1="270" y1="155" x2="328" y2="205" opacity="0.65"/>
    </g>
    ${svgNode(210, 25, peaks.p4)}
    ${svgNode(210, 92, peaks.p3)}
    ${svgNode(150, 155, peaks.p1)}
    ${svgNode(270, 155, peaks.p2)}
    ${svgNode(92, 205, input.month)}
    ${svgNode(210, 205, input.day, "#1b2745")}
    ${svgNode(328, 205, String(input.year || "").slice(-1))}
    ${svgNode(150, 270, challenges.c1, "#1f2633")}
    ${svgNode(270, 270, challenges.c2, "#1f2633")}
    ${svgNode(210, 325, challenges.c3, "#1f2633")}
    ${svgNode(210, 382, challenges.c4, "#1f2633")}
    <text x="92" y="235" text-anchor="middle" font-size="12" fill="#667085">Tháng ${escapeSvg(input.month || "")}</text>
    <text x="210" y="235" text-anchor="middle" font-size="12" font-weight="700" fill="${GOLD}">Ngày ${escapeSvg(input.day || "")}</text>
    <text x="328" y="235" text-anchor="middle" font-size="12" fill="#667085">Năm ${escapeSvg(input.year || "")}</text>
  </svg>`;

  return {
    stack: [
      { svg, width: 420, alignment: "center", margin: [0, 8, 0, 8] }
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
    coverTitleTop: { font: "PlayfairDisplay", fontSize: 35, bold: true, alignment: "center", color: "#272525", lineHeight: 0.92, characterSpacing: 0.2, margin: [0, 0, 0, 0] },
    coverTitleMain: { font: "PlayfairDisplay", fontSize: 48, bold: true, alignment: "center", color: "#272525", lineHeight: 0.92, characterSpacing: 0.2, margin: [0, 0, 0, 18] },
    coverName: { fontSize: 22, bold: true, alignment: "center", color: NAVY, margin: [0, 0, 0, 8] },
    coverNote: { fontSize: 9, alignment: "center", color: "#5c6470" },
    metaLabel: { fontSize: 8.5, color: "#5c6470" },
    metaValue: { fontSize: 13, bold: true, color: NAVY },
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
    quote: { fontSize: 12.8, italics: true, color: "#3f4857", margin: [12, 4, 12, 8] },
    muted: { fontSize: 12, color: MUTED, margin: [0, 0, 0, 8] },
    miniTitle: { fontSize: 12.5, bold: true, color: GOLD, margin: [0, 0, 0, 4] },
    gridCell: { fontSize: 16, bold: true, color: NAVY, alignment: "center", margin: [0, 12, 0, 0] },
    tableHeader: { fontSize: 11.5, bold: true, color: NAVY, fillColor: SOFT },
    tableText: { fontSize: 11.5, color: INK },
    footerText: { fontSize: 9.5, italics: true, color: MUTED },
    backTitle: { fontSize: 23, bold: true, alignment: "center", color: NAVY, margin: [0, 0, 0, 18] },
    backParagraph: { fontSize: 11, alignment: "center", color: INK, margin: [28, 0, 28, 0] },
    socialLinks: { fontSize: 11.5, color: GOLD, lineHeight: 1.55 },
    ctaTitle: { fontSize: 13, bold: true, color: NAVY, margin: [0, 0, 0, 8] },
    ctaLink: { fontSize: 12, bold: true, color: GOLD, decoration: "underline", alignment: "center", margin: [0, 8, 0, 0] }
  };
}

