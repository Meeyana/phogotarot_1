export function stripHtml(input = "") {
  return String(input)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<li>/gi, "• ")
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

export function contentBlocks(data) {
  if (!data) return [{ text: "Nội dung đang được cập nhật.", style: "muted" }];

  if (Array.isArray(data.blocks) && data.blocks.length > 0) {
    return data.blocks.flatMap((block) => {
      const out = [];
      if (block.title) out.push({ text: stripHtml(block.title), style: "blockTitle" });

      if (block.type === "list" && Array.isArray(block.items)) {
        out.push({
          ul: block.items.map((item) => stripHtml(item)),
          style: "paragraph",
          margin: [0, 2, 0, 8]
        });
      } else if (block.type === "quote") {
        out.push({
          text: stripHtml(block.content),
          style: "quote"
        });
      } else if (block.content) {
        out.push({
          text: stripHtml(block.content),
          style: "paragraph"
        });
      }

      return out;
    });
  }

  if (data.content) {
    return stripHtml(data.content).split(/\n{2,}/).filter(Boolean).map((text) => ({
      text,
      style: "paragraph"
    }));
  }

  return [{ text: "Nội dung đang được cập nhật.", style: "muted" }];
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
