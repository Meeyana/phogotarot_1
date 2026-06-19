// Lấy dữ liệu từ node trước (node SEO logic)
const seoData = $input.first().json;
const parsedSeoData = parsedSeoData || JSON.parse(seoData.choices[0].message.content);
// Lấy title từ webhook
const webhookBody = $('Trigger Input').first().json.body || {};
const webhookTitle = webhookBody.title ? webhookBody.title.trim() : "";

const webhookCategory = webhookBody.category;
// Hàm làm sạch chuỗi SEO
function cleanSeoTitle(title) {
  if (!title) return "";
  return title
    .replace(/["""''\/\\]/g, '')
    .replace(/[^\w\s\u00C0-\u1EF9\u0300-\u036F!?:,.()\[\]\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
// Hàm loại bỏ dấu "/" ở đầu slug
function cleanSlug(slug) {
  if (!slug) return "";
  return slug.replace(/^\/+/, ''); // Loại bỏ tất cả dấu "/" ở đầu chuỗi
}
let finalSeoTitle = "";
// 🔥 Nếu webhook có title → Ưu tiên dùng webhook
if (webhookTitle !== "") {
  finalSeoTitle = cleanSeoTitle(webhookTitle);  
} else {
  // 🔥 Không có webhook → dùng AI output
  finalSeoTitle = cleanSeoTitle(parsedSeoData.seoTitle);
}
// Trả về kết quả cuối
return [{
  json: {
    ...parsedSeoData,
    seoTitle: finalSeoTitle,
    slug: cleanSlug(parsedSeoData.slug), // Làm sạch slug, bỏ dấu "/" ở đầu
    webhookTitleUsed: webhookTitle !== "",
    category: webhookCategory// true nếu webhook được dùng
  }
}];