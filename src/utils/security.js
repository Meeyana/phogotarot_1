// src/utils/security.js
import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-cbc';
// Lấy key từ .env, nếu không có thì dùng key dự phòng (chỉ để dev)
const SECRET_KEY = import.meta.env.SECRET_KEY || 'default_secret_key_must_be_32_bytes_long';
const IV_LENGTH = 16; // Độ dài Vector khởi tạo cho AES

// Hàm chuyển Key thành Buffer 32 bytes chuẩn
const getKey = () => crypto.createHash('sha256').update(SECRET_KEY).digest();

export function encryptData(dataObject) {
    try {
        const text = JSON.stringify(dataObject);
        const iv = crypto.randomBytes(IV_LENGTH);
        const key = getKey();
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
        
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        
        // Trả về định dạng: IV:EncryptedData (dạng Hex để an toàn trên URL)
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch (error) {
        console.error("Lỗi mã hóa:", error);
        return null;
    }
}

export function decryptData(encryptedString) {
    try {
        const textParts = encryptedString.split(':');
        // Nếu không đúng định dạng IV:Data
        if (textParts.length !== 2) return null;

        const iv = Buffer.from(textParts[0], 'hex');
        const encryptedText = Buffer.from(textParts[1], 'hex');
        const key = getKey();
        
        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        
        return JSON.parse(decrypted.toString());
    } catch (error) {
        // console.error("Lỗi giải mã:", error); // Có thể log nếu cần debug
        return null;
    }
}