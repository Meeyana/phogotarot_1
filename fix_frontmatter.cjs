const fs = require('fs');
const path = require('path');

const dir = 'd:/Tuan/phogotarot/src/content/blog';

const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));

// Mapping config
const mapping = {
  "bo-an-phu-tarot-4-nguyen-to.md": { category: "tarot căn bản", tags: ["minor arcana", "ẩn phụ", "4 nguyên tố", "wands", "cups", "swords", "pentacles"] },
  "bo-cups-tarot.md": { category: "ý nghĩa lá bài", tags: ["cups", "nguyên tố nước", "cảm xúc", "tình yêu", "minor arcana"] },
  "bo-swords-trong-tarot-luoi-kiem-vo-tinh-hay-lieu-thuoc-dang-da-tat.md": { category: "ý nghĩa lá bài", tags: ["swords", "nguyên tố khí", "trí tuệ", "xung đột", "minor arcana"] },
  "bo-wands-tarot-dam-me-thanh-hanh-dong.md": { category: "ý nghĩa lá bài", tags: ["wands", "nguyên tố lửa", "đam mê", "hành động", "minor arcana"] },
  "boi-bai-tarot-online-mien-phi-va-chinh-xac.md": { category: "cẩm nang xem tarot", tags: ["bói tarot online", "miễn phí", "trực tuyến", "trải bài", "hướng dẫn"] },
  "boi-tarot-ai-dang-yeu-ban-5-dau-hieu-chac-chan.md": { category: "tình yêu & mối quan hệ", tags: ["tình yêu", "dấu hiệu yêu", "bói tarot", "the lovers", "năng lượng"] },
  "co-nen-tin-vao-tarot-khong.md": { category: "tarot căn bản", tags: ["tarot căn bản", "mê tín", "hiệu ứng forer", "tâm lý", "ranh giới"] },
  "huong-dan-cach-trao-bai-tarot-dung-cach-de-ket-noi-nang-luong-va-muc-dich.md": { category: "kỹ năng đọc bài", tags: ["tráo bài", "shuffle", "kỹ năng", "năng lượng", "nghi thức"] },
  "huong-dan-tu-hoc-tarot-cho-nguoi-moi-bat-dau.md": { category: "tarot căn bản", tags: ["tự học tarot", "người mới", "rider-waite-smith", "major arcana", "lộ trình"] },
  "moi-lien-he-giua-than-so-hoc-va-tarot.md": { category: "tarot mở rộng", tags: ["thần số học", "numerology", "lá bài linh hồn", "ngày sinh", "con số"] },
  "nghe-thuat-dat-cau-hoi-tarot-hoi-dung-de-nhan-cau-tra-loi-hay.md": { category: "kỹ năng đọc bài", tags: ["đặt câu hỏi", "câu hỏi mở", "kỹ năng", "tình yêu", "sự nghiệp"] },
  "phat-trien-truc-giac-khi-doc-bai-tarot-ket-noi-sau-sac-hon.md": { category: "kỹ năng đọc bài", tags: ["trực giác", "thiền định", "đọc bài", "chánh niệm", "kết nối"] },
  "shadow-work-tarot-doi-dien-voi-bong-toi-tam-hon-va-hanh-trinh-chua-lanh-chieu-sau.md": { category: "chữa lành & tâm lý", tags: ["shadow work", "carl jung", "chữa lành", "tiềm thức", "bóng tối"] },
  "tam-the-chuan-bi-truoc-khi-buoc-vao-buoi-xem-tarot.md": { category: "cẩm nang xem tarot", tags: ["tâm thế", "chuẩn bị", "buổi xem", "reader", "câu hỏi"] },
  "tarot-chientinhoc-moilienketbinhan.md": { category: "tarot mở rộng", tags: ["chiêm tinh", "astrology", "cung hoàng đạo", "hành tinh", "nguyên tố"] },
  "tarot-cho-du-lich-va-chuyen-di-hoi-bai-truoc-khi-xach-balo-len-va-di.md": { category: "tarot theo tình huống", tags: ["du lịch", "chuyến đi", "trải bài", "the world", "the chariot"] },
  "tarot-chuyen-sau-tinh-yeu-su-nghiep-tai-chinh-12-cung-hoang-dao.md": { category: "công cụ trải bài", tags: ["trải bài chuyên sâu", "tình yêu", "sự nghiệp", "tài chính", "12 cung hoàng đạo"] },
  "tarot-la-gi-su-that-va-giai-ma-lam-tuong.md": { category: "tarot căn bản", tags: ["tarot là gì", "lịch sử", "rider-waite-smith", "carl jung", "lầm tưởng"] },
  "tarot-su-nghiep-khi-nao-nen-nhay-viec-hoac-thang-chuc.md": { category: "công việc & tài chính", tags: ["sự nghiệp", "nhảy việc", "thăng chức", "cơ hội", "the chariot"] },
  "tarot-va-chiem-tinh-giai-ma-moi-lien-he-ngan-nam-giua-cac-la-bai-va-cung-hoang-dao.md": { category: "tarot mở rộng", tags: ["chiêm tinh", "cung hoàng đạo", "major arcana", "nguyên tố", "zodiac"] },
  "to-hop-la-bai-tarot-bao-hieu-tinh-yeu-moi.md": { category: "tình yêu & mối quan hệ", tags: ["tổ hợp bài", "tình yêu mới", "ace of cups", "the lovers", "the fool"] },
  "trai-bai-tarot-nguoi-cung-bach-duong.md": { category: "tarot mở rộng", tags: ["bạch dương", "aries", "the emperor", "the chariot", "nguyên tố lửa"] }
};

for (const file of files) {
  const filePath = path.join(dir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract frontmatter block
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) continue;
  
  const fmRaw = match[1];
  let fmLines = fmRaw.split(/\r?\n/);
  let parsed = {};
  let currentKey = null;
  
  for (let line of fmLines) {
    if (line.match(/^[a-zA-Z0-9_]+:/)) {
      const parts = line.split(':');
      currentKey = parts[0].trim();
      const val = parts.slice(1).join(':').trim();
      if (val) {
        parsed[currentKey] = val;
      } else {
        parsed[currentKey] = '';
      }
    } else if (currentKey && line.match(/^\s+/)) {
      parsed[currentKey] += ' ' + line.trim();
    }
  }
  
  // Fix specific issues
  if (file === 'trai-bai-tarot-nguoi-cung-bach-duong.md') {
    parsed['excerpt'] = 'Khám phá sức mạnh thôi thúc hành động và làm chủ đam mê của người cung Bạch Dương qua lăng kính Tarot. Bản đồ nội tâm cho người tiên phong.';
  }
  if (file === 'tarot-chuyen-sau-tinh-yeu-su-nghiep-tai-chinh-12-cung-hoang-dao.md') {
    if (parsed['image']) {
      parsed['image'] = parsed['image'].replace(/\/\//g, '/');
    }
  }
  
  // Ensure quotes for string fields (title, image, excerpt, category)
  for (let key of ['title', 'image', 'excerpt', 'category']) {
    if (parsed[key]) {
      let val = parsed[key].replace(/^"|"$/g, '').replace(/^'|'$/g, '').trim();
      // Remove escaping quotes internally if there are any that were messed up
      val = val.replace(/\\"/g, '"').replace(/"/g, '\\"'); // escape double quotes
      parsed[key] = `"${val}"`;
    }
  }
  
  // Add category and tags from mapping
  if (mapping[file]) {
    if (mapping[file].category) {
      let val = mapping[file].category;
      parsed['category'] = `"${val}"`;
    }
    if (mapping[file].tags) {
      parsed['tags'] = `[${mapping[file].tags.map(t => `"${t}"`).join(', ')}]`;
    }
  }
  
  // Reconstruct frontmatter
  let newFm = '---\n';
  const order = ['title', 'image', 'excerpt', 'pubDate', 'category', 'tags', 'isFeatured', 'slug'];
  
  for (let key of order) {
    if (parsed[key] !== undefined) {
      newFm += `${key}: ${parsed[key]}\n`;
    }
  }
  // add any other fields
  for (let key in parsed) {
    if (!order.includes(key)) {
      newFm += `${key}: ${parsed[key]}\n`;
    }
  }
  newFm += '---';
  
  const newContent = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, newFm);
  fs.writeFileSync(filePath, newContent, 'utf8');
}
console.log('Done fixing frontmatter!');
