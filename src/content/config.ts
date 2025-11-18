import { defineCollection, z } from 'astro:content';

// 1. Collection 'blog'
const blogCollection = defineCollection({
  schema: z.object({
    title: z.string(),
    // Nên để optional cho ảnh, phòng khi bạn chưa kịp tìm ảnh bìa
    image: z.string().optional(), 
    excerpt: z.string().optional(),
    pubDate: z.date(),
    // Nếu không chọn nổi bật, mặc định là false (không lỗi)
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

// 2. Collection 'cards' (Đã tối ưu)
const cardsCollection = defineCollection({
  schema: z.object({
    title: z.string(), 
    
    // Bắt buộc có ảnh (vì là xem bài Tarot), nhưng cứ để string là chuẩn với Decap
    image: z.string(), 
    
    excerpt: z.string().optional(), // Có thể để trống mô tả ngắn

    index: z.number(),

    // Khớp chính xác với giá trị 'value' trong file config.yml
    group: z.enum([
      'major',     
      'wands',     
      'cups',      
      'swords',    
      'pentacles'  
    ]),
    
    // QUAN TRỌNG: Thêm .default([]) 
    // Lý do: Nếu bạn lỡ tay xóa hết từ khóa trên CMS, nó sẽ trả về mảng rỗng thay vì làm sập web
    upright_keywords: z.array(z.string()).default([]), 
    reversed_keywords: z.array(z.string()).default([]), 
  }),
});

// 3. Xuất cả hai collection
export const collections = {
  'blog': blogCollection,
  'cards': cardsCollection, 
};