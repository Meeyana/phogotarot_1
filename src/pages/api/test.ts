export const prerender = false; // Luôn nhớ dòng này với chế độ Hybrid

export const GET = () => {
  return new Response(JSON.stringify({
      message: "API hoạt động tốt!",
      time: new Date().toISOString()
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}