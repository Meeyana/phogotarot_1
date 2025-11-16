import { defineCollection, z } from 'astro:content';

// Định nghĩa "Schema" (cấu trúc) cho bài viết blog
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    image: z.string(),
    excerpt: z.string(),
    pubDate: z.date()
  }),
});

// 2. (MỚI) Định nghĩa collection 'cards' cho 78 lá bài
const cardsCollection = defineCollection({
  schema: z.object({
    title: z.string(), // Tên lá bài (ví dụ: The Fool)
    image: z.string(), // Hình ảnh lá bài
    excerpt: z.string(), // Mô tả ngắn (cho trang danh sách)
    // Thêm các trường dành riêng cho lá bài
    upright_keywords: z.array(z.string()), // Từ khóa xuôi
    reversed_keywords: z.array(z.string()), // Từ khóa ngược
    // ... bạn có thể thêm bất kỳ trường nào khác
  }),
});

// 3. Xuất cả hai collection
export const collections = {
  'blog': blogCollection,
  'cards': cardsCollection, // Thêm 'cards' vào đây
};