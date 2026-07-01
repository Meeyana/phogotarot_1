export interface SystemConfig {
    USE_LOCAL_AI: boolean;
    AI_API_URL: string;
    DEFAULT_API_KEY: string;
    MODEL_1: string;
    MODEL_2: string;
    ROUTER_MODEL_1: string;
    ROUTER_MODEL_2: string;
    FALLBACK_API_URL: string;
    AI_PROVIDER_ORDER: AiProvider[];
}

export type AiProvider = 'n8n' | 'router' | 'openai';

const DEFAULT_PROVIDER_ORDER: AiProvider[] = ['n8n', 'router', 'openai'];
const INTERNAL_PROVIDER_ORDER: AiProvider[] = ['router', 'openai'];

export function normalizeAiProviderOrder(value: any, useN8nFirst = true): AiProvider[] {
    const source = Array.isArray(value)
        ? value
        : typeof value === 'string'
            ? value.split(',')
            : useN8nFirst
                ? DEFAULT_PROVIDER_ORDER
                : INTERNAL_PROVIDER_ORDER;

    const normalized = source
        .map((item: any) => String(item || '').trim().toLowerCase())
        .filter((item: string): item is AiProvider => item === 'n8n' || item === 'router' || item === 'openai');

    return [...new Set(normalized)];
}

export async function getSystemConfig(env: any): Promise<SystemConfig> {
    // 1. Khởi tạo cấu hình bằng giá trị mặc định từ biến môi trường (.dev.vars hoặc Cloudflare Dashboard)
    // Điều này đảm bảo hệ thống không chết nếu KV chưa được thiết lập.
    const config: SystemConfig = {
        USE_LOCAL_AI: env.USE_LOCAL_AI === 'true',
        AI_API_URL: env.AI_API_URL || '',
        DEFAULT_API_KEY: env.DEFAULT_API_KEY || '',
        MODEL_1: env.MODEL_1 || 'gpt-4o',
         MODEL_2: env.MODEL_2 || 'gpt-4o-mini',
         ROUTER_MODEL_1: env.ROUTER_MODEL_1 || 'n8n',
         ROUTER_MODEL_2: env.ROUTER_MODEL_2 || 'n8n2',
         FALLBACK_API_URL: env.FALLBACK_API_URL || 'https://api.openai.com/v1/chat/completions',
         AI_PROVIDER_ORDER: normalizeAiProviderOrder(env.AI_PROVIDER_ORDER, env.USE_LOCAL_AI === 'true')
     };

    // 2. Thử đọc cấu hình từ Cloudflare KV (ghi đè lên cấu hình mặc định)
    if (env.SESSION) {
        try {
            const kvConfigStr = await env.SESSION.get('SYSTEM_CONFIG');
            if (kvConfigStr) {
                const kvConfig = JSON.parse(kvConfigStr);
                
                // Merge KV vào config gốc (Ngoại trừ API KEY luôn đọc từ .env để bảo mật tuyệt đối)
                if (typeof kvConfig.USE_LOCAL_AI !== 'undefined') config.USE_LOCAL_AI = kvConfig.USE_LOCAL_AI;
                if (kvConfig.AI_API_URL) config.AI_API_URL = kvConfig.AI_API_URL;
                if (kvConfig.MODEL_1) config.MODEL_1 = kvConfig.MODEL_1;
                if (kvConfig.MODEL_2) config.MODEL_2 = kvConfig.MODEL_2;
                 if (kvConfig.ROUTER_MODEL_1) config.ROUTER_MODEL_1 = kvConfig.ROUTER_MODEL_1;
                 if (kvConfig.ROUTER_MODEL_2) config.ROUTER_MODEL_2 = kvConfig.ROUTER_MODEL_2;
                 if (kvConfig.FALLBACK_API_URL) config.FALLBACK_API_URL = kvConfig.FALLBACK_API_URL;
                 if (typeof kvConfig.AI_PROVIDER_ORDER !== 'undefined') {
                     config.AI_PROVIDER_ORDER = normalizeAiProviderOrder(kvConfig.AI_PROVIDER_ORDER, config.USE_LOCAL_AI);
                 }
             }
        } catch (error) {
            console.error("Lỗi đọc SYSTEM_CONFIG từ KV:", error);
        }
    }

    return config;
}
