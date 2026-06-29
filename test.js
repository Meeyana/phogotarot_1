var window = {};
(function () {
  "use strict";

  function stripHtml(input) {
    return String(input || "")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<li>/gi, "- ")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function stripMarkdown(input) {
    return String(input || "")
      .replace(/^---[\s\S]*?---\s*/g, "")
      .replace(/âœ¦/g, "")
      .replace(/[â˜‰â˜½â˜¿â™€â™‚â™ƒâ™„â™…â™†â™‡]/g, "")
      .replace(/[\u2600-\u27BF]/g, "")
      .replace(/^\s*[-*+]\s+/gm, "- ")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .replace(/_(.*?)_/g, "$1")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function readableText(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (Array.isArray(value)) return value.map(readableText).filter(Boolean).join("\n");
    if (typeof value === "object") {
      for (var key of ["text", "content", "value", "html", "body", "rawContent", "title"]) {
        if (typeof value[key] === "string") return value[key];
      }
      return "";
    }
    return "";
  }

  function paragraphsFromText(text, parser) {
    return parser(text)
      .split(/\n{2,}/)
      .map(function (item) { return item.trim(); })
      .filter(Boolean)
      .map(function (t) { return { text: t, style: "paragraph" }; });
  }

  function quoteBlock(text) {
    return {
      table: {
        widths: ["*"],
        body: [[{
          text: text,
          style: "quoteText",
          margin: [12, 8, 12, 8]
        }]]
      },
      unbreakable: true,
      layout: {
        fillColor: function () { return "#fff4df"; },
        hLineWidth: function () { return 0; },
        vLineWidth: function (i) { return i === 0 ? 2 : 0; },
        vLineColor: function () { return "#c7972f"; },
        paddingLeft: function () { return 0; },
        paddingRight: function () { return 0; },
        paddingTop: function () { return 0; },
        paddingBottom: function () { return 0; }
      },
      margin: [0, 4, 0, 10]
    };
  }

  function markdownBlocks(text) {
    var clean = stripMarkdown(text);
    var blocks = [];
    var paragraphLines = [];
    var quoteLines = [];

    var flushParagraph = function () {
      var p = paragraphLines.join("\n").trim();
      if (p) blocks.push({ text: p, style: "paragraph" });
      paragraphLines = [];
    };
    var flushQuote = function () {
      var q = quoteLines.join("\n").trim();
      if (q) blocks.push(quoteBlock(q));
      quoteLines = [];
    };

    var lines = clean.split("\n");
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var heading = line.match(/^#{1,6}\s*(.+)$/);
      if (heading) {
        flushParagraph(); flushQuote();
        blocks.push({ text: heading[1].trim(), style: "blockTitle" });
        continue;
      }
      if (!line.trim()) { flushParagraph(); flushQuote(); continue; }
      var quote = line.match(/^\s*>\s?(.*)$/);
      if (quote) { flushParagraph(); quoteLines.push(quote[1].trim()); continue; }
      flushQuote();
      paragraphLines.push(line);
    }
    flushParagraph(); flushQuote();
    return blocks;
  }

  function contentBlocks(data) {
    if (!data) return [{ text: "Ná»™i dung Ä‘ang Ä‘Æ°á»£c cáº­p nháº­t.", style: "muted" }];

    if (Array.isArray(data.blocks) && data.blocks.length > 0) {
      return data.blocks.flatMap(function (block) {
        var out = [];
        if (block.title) out.push({ text: stripHtml(readableText(block.title)), style: "blockTitle" });
        if (block.type === "list" && Array.isArray(block.items)) {
          out.push({ ul: block.items.map(function (item) { return stripHtml(readableText(item)); }), style: "paragraph", margin: [0, 2, 0, 8] });
        } else if (block.type === "quote") {
          out.push(quoteBlock(stripHtml(readableText(block.content))));
        } else if (block.content) {
          out.push({ text: stripHtml(readableText(block.content)), style: "paragraph" });
        }
        return out;
      });
    }

    if (data.rawContent) return markdownBlocks(data.rawContent);

    var ct = readableText(data.content);
    if (ct) return paragraphsFromText(ct, stripHtml);

    return [{ text: "Ná»™i dung Ä‘ang Ä‘Æ°á»£c cáº­p nháº­t.", style: "muted" }];
  }

  function safeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  window.__pdfContentNormalizer = {
    contentBlocks: contentBlocks,
    safeArray: safeArray,
    stripHtml: stripHtml,
    stripMarkdown: stripMarkdown
  };
})();

console.log(window.__pdfContentNormalizer.stripMarkdown('### Heading 3\r\nSome text'));
