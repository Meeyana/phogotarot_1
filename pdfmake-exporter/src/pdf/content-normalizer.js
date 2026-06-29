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

export function stripMarkdown(input = "") {
  return String(input)
    .replace(/^---[\s\S]*?---\s*/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "• ")
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
    for (const key of ["text", "content", "value", "html", "body", "rawContent", "title"]) {
      if (typeof value[key] === "string") return value[key];
    }
    return "";
  }
  return "";
}

function paragraphsFromText(text, parser = stripHtml) {
  return parser(text)
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((text) => ({
      text,
      style: "paragraph"
    }));
}

export function contentBlocks(data) {
  if (!data) return [{ text: "Nội dung đang được cập nhật.", style: "muted" }];

  if (Array.isArray(data.blocks) && data.blocks.length > 0) {
    return data.blocks.flatMap((block) => {
      const out = [];
      if (block.title) out.push({ text: stripHtml(readableText(block.title)), style: "blockTitle" });

      if (block.type === "list" && Array.isArray(block.items)) {
        out.push({
          ul: block.items.map((item) => stripHtml(readableText(item))),
          style: "paragraph",
          margin: [0, 2, 0, 8]
        });
      } else if (block.type === "quote") {
        out.push({
          text: stripHtml(readableText(block.content)),
          style: "quote"
        });
      } else if (block.content) {
        out.push({
          text: stripHtml(readableText(block.content)),
          style: "paragraph"
        });
      }

      return out;
    });
  }

  if (data.rawContent) {
    return paragraphsFromText(data.rawContent, stripMarkdown);
  }

  const contentText = readableText(data.content);
  if (contentText) {
    return paragraphsFromText(contentText, stripHtml);
  }

  return [{ text: "Nội dung đang được cập nhật.", style: "muted" }];
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}
