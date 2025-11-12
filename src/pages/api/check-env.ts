export async function GET() {
  return new Response(
    JSON.stringify({
      GITHUB_TOKEN: !!process.env.GITHUB_TOKEN,
      ADMIN_KEY: process.env.ADMIN_KEY ? "loaded" : "missing",
      ENV_SAMPLE: process.env.ADMIN_KEY, // để kiểm tra giá trị thật
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
