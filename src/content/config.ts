import { defineCollection, z } from 'astro:content';

// Định nghĩa "Schema" (cấu trúc) cho bài viết blog
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    image: z.string(),
    excerpt: z.string(),
    pubDate: z.date(),
    isFeatured: z.boolean().optional()
  }),
});

// 2. (CẬP NHẬT) Định nghĩa collection 'cards' cho 78 lá bài
const cardsCollection = defineCollection({
  schema: z.object({
    title: z.string(), // Tên lá bài (ví dụ: The Fool)
    image: z.string(), // Hình ảnh lá bài
    excerpt: z.string(), // Mô tả ngắn

    // --- CÁC TRƯỜNG MỚI BẠN YÊU CẦU ---

    /**
     * Số thứ tự duy nhất của lá bài (từ 0 đến 77).
     * Dùng làm định danh (ID).
     */
    index: z.number(),

    /**
     * Phân loại nhóm lá bài. 
     * Bắt buộc phải là 1 trong 5 giá trị này.
     */
    group: z.enum([
      'major',     // Ẩn Chính
      'wands',     // Bộ Gậy
      'cups',      // Bộ Cốc
      'swords',    // Bộ Kiếm
      'pentacles'  // Bộ Tiền
    ]),
    
    // --- CÁC TRƯỜNG CŨ VẪN GIỮ NGUYÊN ---
    upright_keywords: z.array(z.string()), // Từ khóa xuôi
    reversed_keywords: z.array(z.string()), // Từ khóa ngược
  }),
});

// 3. Xuất cả hai collection
export const collections = {
  'blog': blogCollection,
  'cards': cardsCollection, // Thêm 'cards' vào đây
};