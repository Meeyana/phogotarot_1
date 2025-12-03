import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async () => {
  const hasKey = !!import.meta.env.SECRET_KEY;
  
  return new Response(
    JSON.stringify({ 
      hasSecretKey: hasKey,
      keyLength: import.meta.env.SECRET_KEY?.length || 0
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
};