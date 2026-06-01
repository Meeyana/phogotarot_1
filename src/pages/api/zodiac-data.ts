import type { APIRoute } from 'astro';

export const prerender = false;

const SHEET_ID = '1Bqu2RBPRH-YeCOiX_5SjmQP8GETpKkqBZhMPZwqm_ig';
const SHEET_NAME = 'Zodiac';
const GVIZ_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

export const GET: APIRoute = async (context) => {
    try {
        const env: any = context.locals.runtime?.env || process.env;
        const kv = env.SESSION;
        
        // Lấy ngày hiện tại theo giờ VN
        const vnTime = new Date(new Date().getTime() + 7 * 3600 * 1000);
        const todayStr = vnTime.toISOString().split('T')[0]; // Ví dụ: 2026-06-01
        const cacheKey = `ZODIAC_DAILY_CACHE`;

        // 1. KIỂM TRA CACHE
        if (kv) {
            const cachedObject = await kv.get(cacheKey, 'json');
            // Chỉ trả về nếu ngày trong cache khớp với ngày hôm nay
            if (cachedObject && cachedObject.date === todayStr) {
                return new Response(JSON.stringify(cachedObject.data), {
                    status: 200,
                    headers: { 
                        'Content-Type': 'application/json',
                        'X-Cache': 'HIT'
                    }
                });
            }
        }

        // 2. NẾU KHÔNG CÓ CACHE HOẶC KHÁC NGÀY -> GỌI GOOGLE SHEETS
        const response = await fetch(GVIZ_URL);
        if (!response.ok) {
            throw new Error(`Google Sheets API lỗi! HTTP Status: ${response.status}`);
        }
        
        const text = await response.text();
        
        // Bóc tách JSONP
        const jsonpMatch = text.match(/google\.visualization\.Query\.setResponse\((.*)\)/s);
        if (!jsonpMatch || !jsonpMatch[1]) {
            throw new Error("Không thể parse dữ liệu JSONP từ Google Sheets");
        }
        
        const data = JSON.parse(jsonpMatch[1]);
        const rows = data.table.rows;
        const processedData: Record<string, any> = {};
        
        // Chuyển đổi dữ liệu
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i].c;
            const zodiacSign = row[0]?.v;
            if (!zodiacSign) continue;
            
            processedData[zodiacSign] = {
                cardname: row[1]?.v || "N/A",
                url: row[2]?.v || "https://placehold.co/300x500/142850/f0f0ff?text=No+Image",
                keyword: row[3]?.v || "",
                love: row[4]?.v || "<p>Chưa có thông tin.</p>",
                job: row[5]?.v || "<p>Chưa có thông tin.</p>",
                finance: row[6]?.v || "<p>Chưa có thông tin.</p>",
                color: row[7]?.v || "N/A",
                objects: row[8]?.v || "N/A",
                locations: row[9]?.v || "N/A",
                advice: row[10]?.v || "<p>Chưa có thông tin.</p>",
            };
        }

        // 3. LƯU VÀO CACHE BẰNG CÁCH GHI ĐÈ KEY DUY NHẤT (Vẫn đặt Hạn sử dụng: 24 tiếng = 86400 giây cho an toàn dọn rác)
        if (kv) {
            const cachePayload = {
                date: todayStr,
                data: processedData
            };
            await kv.put(cacheKey, JSON.stringify(cachePayload), { expirationTtl: 86400 });
        }

        return new Response(JSON.stringify(processedData), {
            status: 200,
            headers: { 
                'Content-Type': 'application/json',
                'X-Cache': 'MISS'
            }
        });
        
    } catch (error: any) {
        console.error("Lỗi lấy dữ liệu Zodiac Daily API:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
};
