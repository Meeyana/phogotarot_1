// src/utils/crypto.ts
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-cbc';
// Lấy key từ biến môi trường, nếu không có thì dùng fallback (chỉ dev)
// Lưu ý: SECRET_KEY phải đủ dài, ta sẽ hash nó để đảm bảo luôn đủ 32 bytes
const SECRET_KEY = import.meta.env.SECRET_KEY || 'mac-dinh-phai-thay-doi-tren-netlify';
const key = crypto.createHash('sha256').update(String(SECRET_KEY)).digest('base64').substring(0, 32);

export const encryptData = (data: object): string => {
  const iv = crypto.randomBytes(16); // Tạo vector khởi tạo ngẫu nhiên
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const strData = JSON.stringify(data);
  let encrypted = cipher.update(strData, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  // Trả về chuỗi dạng: IV:EncryptedData (để khi giải mã biết dùng IV nào)
  return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptData = (encryptedString: string): any => {
  try {
    const textParts = encryptedString.split(':');
    const iv = Buffer.from(textParts.shift() as string, 'hex');
    const encryptedText = textParts.join(':');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return null; // Trả về null nếu giải mã lỗi (link sai/hết hạn)
  }
};