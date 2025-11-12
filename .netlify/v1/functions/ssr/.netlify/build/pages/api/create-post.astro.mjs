import fs from 'fs';
import path from 'path';
export { renderers } from '../../renderers.mjs';

const prerender = false;
async function POST({ request }) {
  try {
    const rawBody = await request.text();
    console.log("🔍 rawBody:", rawBody);
    if (!rawBody) {
      return new Response("Body trống - client không gửi JSON", { status: 400 });
    }
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      return new Response("Không parse được JSON", { status: 400 });
    }
    const { title, image = "", excerpt = "", content = "", adminKey } = data;
    if (adminKey !== process.env.ADMIN_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }
    if (!title || !content) {
      return new Response("Thiếu tiêu đề hoặc nội dung", { status: 400 });
    }
    const slug = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    const markdown = `---
title: "${title.replace(/"/g, '\\"')}"
image: "${image}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
date: ${(/* @__PURE__ */ new Date()).toISOString()}
---

${content}
`;
    const blogDir = path.join(process.cwd(), "src/content/blog");
    if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
    fs.writeFileSync(path.join(blogDir, `${slug}.md`), markdown, "utf8");
    const repo = process.env.GITHUB_REPO;
    const token = process.env.GITHUB_TOKEN;
    const user = process.env.GITHUB_USER || "auto-publisher";
    if (!repo || !token) {
      return new Response("Thiếu GITHUB_TOKEN hoặc GITHUB_REPO", { status: 500 });
    }
    const apiUrl = `https://api.github.com/repos/${repo}/contents/src/content/blog/${slug}.md`;
    const base64 = Buffer.from(markdown).toString("base64");
    const res = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/vnd.github+json"
      },
      body: JSON.stringify({
        message: `Add new blog post: ${title}`,
        content: base64,
        committer: {
          name: user,
          email: `${user}@users.noreply.github.com`
        }
      })
    });
    if (!res.ok) {
      const errText = await res.text();
      return new Response("Lỗi push GitHub: " + errText, { status: 500 });
    }
    return new Response(`✅ Bài viết "${title}" đã được tạo và push lên GitHub thành công!`);
  } catch (err) {
    console.error("❌ Lỗi server:", err);
    return new Response("❌ Server error: " + err.message, { status: 500 });
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST,
  prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
