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

// Xuất ra bộ sưu tập tên là 'blog'
export const collections = {
  'blog': blogCollection,
};