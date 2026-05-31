// In-memory store cho Cloudflare Workers (tồn tại trong suốt vòng đời của isolate)
// Đây là giải pháp Rate Limiting cực kỳ nhanh và tiết kiệm chi phí
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

/**
 * Kiểm tra Rate Limit
 * @param identifier ID người dùng hoặc địa chỉ IP
 * @param limit Số lần gọi tối đa cho phép
 * @param windowSeconds Cửa sổ thời gian (giây)
 */
export function checkRateLimit(
  identifier: string, 
  limit: number, 
  windowSeconds: number
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);
  
  if (!record || now > record.resetTime) {
    // Chưa có record hoặc đã hết thời gian giới hạn -> Tạo mới
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowSeconds * 1000
    });
    return { success: true, remaining: limit - 1, resetTime: now + windowSeconds * 1000 };
  }
  
  if (record.count >= limit) {
    // Đã vượt quá giới hạn
    return { success: false, remaining: 0, resetTime: record.resetTime };
  }
  
  // Tăng biến đếm
  record.count += 1;
  return { success: true, remaining: limit - record.count, resetTime: record.resetTime };
}

/**
 * Tự động dọn dẹp các record đã hết hạn để tránh Memory Leak
 * Hàm này có thể được gọi thỉnh thoảng, không cần gọi liên tục
 */
export function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}
