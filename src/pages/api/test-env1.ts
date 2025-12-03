import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const hasKey = !!import.meta.env.SECRET_KEY;
  const keyLength = import.meta.env.SECRET_KEY?.length || 0;
  
  // Thêm thông tin debug cho production
  return new Response(
    JSON.stringify({ 
      hasSecretKey: hasKey,
      keyLength: keyLength,
      environment: import.meta.env.MODE, // 'development' hoặc 'production'
      nodeEnv: process.env.NODE_ENV,
      // KHÔNG log giá trị thật của SECRET_KEY!
    }),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      } 
    }
  );
};