// netlify/functions/tarot-validate.js

exports.handler = async (event, context) => {
  // Chỉ chấp nhận method POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 1. Lấy dữ liệu từ Frontend gửi lên
    const body = JSON.parse(event.body);

    // 2. Lấy Biến môi trường (Netlify tự bơm vào process.env)
    const n8nUrl = process.env.N8N_TAROT_VALIDATE;
    const n8nSecret = process.env.N8N_SECRET;

    // Log kiểm tra (Xem trong Netlify Function Logs)
    console.log("Đang gọi n8n URL:", n8nUrl ? "Đã có" : "THIẾU");

    if (!n8nUrl) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server chưa cấu hình URL n8n" }),
      };
    }

    // 3. Gọi sang n8n
    const response = await fetch(n8nUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Secret-Token": n8nSecret || "",
      },
      body: JSON.stringify(body),
    });

    // 4. Trả kết quả về cho Frontend
    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error("Lỗi:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};