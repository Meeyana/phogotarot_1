// src/utils/encryption.ts
import crypto from 'crypto';

const SECRET_KEY = import.meta.env.SECRET_KEY || 'your-fallback-secret-key-change-this';

/**
 * Mã hóa dữ liệu thành token an toàn
 * @param data - Object chứa thông tin cần mã hóa
 * @returns Token đã mã hóa
 */
export function encryptData(data: Record<string, any>): string {
  try {
    // 1. Chuyển object thành JSON string
    const jsonStr = JSON.stringify(data);
    
    // 2. Encode Base64
    const base64 = Buffer.from(jsonStr, 'utf-8').toString('base64url');
    
    // 3. Tạo HMAC signature để verify
    const hmac = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(base64)
      .digest('base64url');
    
    // 4. Kết hợp: data.signature
    return `${base64}.${hmac}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Giải mã token về dữ liệu gốc
 * @param token - Token đã mã hóa
 * @returns Object dữ liệu gốc hoặc null nếu invalid
 */
export function decryptData(token: string): Record<string, any> | null {
  try {
    // 1. Tách data và signature
    const [base64Data, receivedHmac] = token.split('.');
    
    if (!base64Data || !receivedHmac) {
      console.warn('Invalid token format');
      return null;
    }
    
    // 2. Verify HMAC signature
    const calculatedHmac = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(base64Data)
      .digest('base64url');
    
    if (calculatedHmac !== receivedHmac) {
      console.warn('HMAC verification failed - token may be tampered');
      return null;
    }
    
    // 3. Decode Base64 về JSON
    const jsonStr = Buffer.from(base64Data, 'base64url').toString('utf-8');
    
    // 4. Parse JSON về object
    return JSON.parse(jsonStr);
    
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Tạo token có thời hạn (optional - nếu cần)
 * @param data - Dữ liệu cần mã hóa
 * @param expiresInHours - Số giờ hết hạn (mặc định 24h)
 */
export function encryptWithExpiry(
  data: Record<string, any>,
  expiresInHours: number = 24
): string {
  const expiryTime = Date.now() + expiresInHours * 60 * 60 * 1000;
  const payload = {
    ...data,
    _exp: expiryTime
  };
  return encryptData(payload);
}

/**
 * Giải mã và kiểm tra thời hạn
 */
export function decryptWithExpiry(token: string): Record<string, any> | null {
  const data = decryptData(token);
  
  if (!data) return null;
  
  // Kiểm tra expiry nếu có
  if (data._exp && Date.now() > data._exp) {
    console.warn('Token expired');
    return null;
  }
  
  // Xóa field _exp trước khi return
  const { _exp, ...cleanData } = data;
  return cleanData;
}