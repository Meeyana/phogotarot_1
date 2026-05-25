export const prerender = false;
import fs from "fs";
import path from "path";
import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    // 👇 Đọc thô body text thay vì request.json()
    const rawBody = await request.text();

    // Log cho chắc
    console.log("🔍 rawBody:", rawBody);

    if (!rawBody) {
      return new Response("Body trống - client không gửi JSON", { status: 400 });
    }

    // Parse thủ công
    let data;
    try {
      data = JSON.parse(rawBody);
    } catch {
      return new Response("Không parse được JSON", { status: 400 });
    }

    const { title, image = "", excerpt = "", content = "", adminKey } = data;

    // Kiểm tra key
    if (adminKey !== process.env.ADMIN_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (!title || !content) {
      return new Response("Thiếu tiêu đề hoặc nội dung", { status: 400 });
    }

    // Tạo slug
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    // Frontmatter
    const markdown = `---
title: "${title.replace(/"/g, '\\"')}"
image: "${image}"
excerpt: "${excerpt.replace(/"/g, '\\"')}"
date: ${new Date().toISOString()}
---

${content}
`;

    // Ghi file local
    const blogDir = path.join(process.cwd(), "src/content/blog");
    if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
    fs.writeFileSync(path.join(blogDir, `${slug}.md`), markdown, "utf8");

    // Push GitHub
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
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: `Add new blog post: ${title}`,
        content: base64,
        committer: {
          name: user,
          email: `${user}@users.noreply.github.com`,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return new Response("Lỗi push GitHub: " + errText, { status: 500 });
    }

    return new Response(`✅ Bài viết "${title}" đã được tạo và push lên GitHub thành công!`);
  } catch (err: any) {
    console.error("❌ Lỗi server:", err);
    return new Response("❌ Server error: " + err.message, { status: 500 });
  }
}
