import { defineCollection, z } from 'astro:content';

// 1. Collection 'blog'
const blogCollection = defineCollection({
  // Thay đổi ở đây: Thêm ({ image }) vào đầu hàm schema
  schema: ({ image }) => z.object({
    title: z.string(),
    // Sửa z.string() thành image()
    image: image().optional(), 
    excerpt: z.string().optional(),
    pubDate: z.date(),
    isFeatured: z.boolean().default(false), 
    category: z.enum([
      "tarot căn bản",
      "kỹ năng đọc bài",
      "ý nghĩa lá bài",
      "tarot theo tình huống",
      "công cụ trải bài",
      "tarot mở rộng"
    ]).optional()
  }),
});

// 2. Collection 'cards'
const cardsCollection = defineCollection({
  // Thay đổi ở đây: Thêm ({ image }) vào đầu hàm schema
  schema: ({ image }) => z.object({
    title: z.string(), 
    
    // QUAN TRỌNG: Sửa z.string() thành image()
    // Decap CMS vẫn lưu là string trong file .md, nhưng Astro sẽ đọc nó và convert thành ảnh thật.
    image: image(), 
    
    excerpt: z.string().optional(),
    index: z.number(),
    group: z.enum(['major', 'wands', 'cups', 'swords', 'pentacles']),
    upright_keywords: z.array(z.string()).default([]), 
    reversed_keywords: z.array(z.string()).default([]), 
  }),
});

export const collections = {
  'blog': blogCollection,
  'cards': cardsCollection,
};