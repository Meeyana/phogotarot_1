export interface SystemConfig {
    USE_LOCAL_AI: boolean;
    AI_API_URL: string;
    DEFAULT_API_KEY: string;
    MODEL_1: string;
    MODEL_2: string;
    ROUTER_MODEL_1: string;
    ROUTER_MODEL_2: string;
    FALLBACK_API_URL: string;
    DEEPSEEK_API_URL: string;
    DEEPSEEK_MODEL_1: string;
    DEEPSEEK_MODEL_2: string;
    AI_PROVIDER_ORDER: AiProvider[];
    AI_ROUTES?: AiRoutesConfig;
}

export type AiProvider = 'n8n' | 'router' | 'openai' | 'deepseek';
export type AiRouteKey = 'tarot' | 'yesno';

export interface AiRouteConfig {
    AI_PROVIDER_ORDER?: AiProvider[];
    MODEL_1?: string;
    MODEL_2?: string;
    DEEPSEEK_MODEL_1?: string;
    DEEPSEEK_MODEL_2?: string;
}

export type AiRoutesConfig = Partial<Record<AiRouteKey, AiRouteConfig>>;

const DEFAULT_PROVIDER_ORDER: AiProvider[] = ['n8n', 'router', 'deepseek', 'openai'];
const INTERNAL_PROVIDER_ORDER: AiProvider[] = ['router', 'deepseek', 'openai'];

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
        .filter((item: string): item is AiProvider => item === 'n8n' || item === 'router' || item === 'openai' || item === 'deepseek');

    return [...new Set(normalized)];
}

export function getRouteSystemConfig(config: SystemConfig, route: AiRouteKey): SystemConfig {
    const routeConfig = config.AI_ROUTES?.[route] || {};
    return {
        ...config,
        MODEL_1: routeConfig.MODEL_1 || config.MODEL_1,
        MODEL_2: routeConfig.MODEL_2 || config.MODEL_2,
        DEEPSEEK_MODEL_1: routeConfig.DEEPSEEK_MODEL_1 || config.DEEPSEEK_MODEL_1,
        DEEPSEEK_MODEL_2: routeConfig.DEEPSEEK_MODEL_2 || config.DEEPSEEK_MODEL_2,
        AI_PROVIDER_ORDER: normalizeAiProviderOrder(routeConfig.AI_PROVIDER_ORDER || config.AI_PROVIDER_ORDER, config.USE_LOCAL_AI)
    };
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
         DEEPSEEK_API_URL: env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',
         DEEPSEEK_MODEL_1: env.DEEPSEEK_MODEL_1 || 'deepseek-v4-pro',
         DEEPSEEK_MODEL_2: env.DEEPSEEK_MODEL_2 || 'deepseek-v4-pro',
         AI_PROVIDER_ORDER: normalizeAiProviderOrder(env.AI_PROVIDER_ORDER, env.USE_LOCAL_AI === 'true'),
         AI_ROUTES: {
             tarot: { AI_PROVIDER_ORDER: DEFAULT_PROVIDER_ORDER },
             yesno: { AI_PROVIDER_ORDER: DEFAULT_PROVIDER_ORDER }
         }
     };

    // 2. Thử đọc cấu hình từ Cloudflare KV (ghi đè lên cấu hình mặc định)
    const sessionKV = env.SESSION || env.phogotarot_session;
    if (sessionKV) {
        try {
            const kvConfigStr = await sessionKV.get('SYSTEM_CONFIG');
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
                 if (kvConfig.DEEPSEEK_API_URL) config.DEEPSEEK_API_URL = kvConfig.DEEPSEEK_API_URL;
                 if (kvConfig.DEEPSEEK_MODEL_1) config.DEEPSEEK_MODEL_1 = kvConfig.DEEPSEEK_MODEL_1;
                 if (kvConfig.DEEPSEEK_MODEL_2) config.DEEPSEEK_MODEL_2 = kvConfig.DEEPSEEK_MODEL_2;
                 if (typeof kvConfig.AI_PROVIDER_ORDER !== 'undefined') {
                     config.AI_PROVIDER_ORDER = normalizeAiProviderOrder(kvConfig.AI_PROVIDER_ORDER, config.USE_LOCAL_AI);
                 }
                 if (kvConfig.AI_ROUTES && typeof kvConfig.AI_ROUTES === 'object') {
                     config.AI_ROUTES = {
                         tarot: kvConfig.AI_ROUTES.tarot ? {
                             ...kvConfig.AI_ROUTES.tarot,
                             AI_PROVIDER_ORDER: normalizeAiProviderOrder(kvConfig.AI_ROUTES.tarot.AI_PROVIDER_ORDER, config.USE_LOCAL_AI)
                         } : undefined,
                         yesno: kvConfig.AI_ROUTES.yesno ? {
                             ...kvConfig.AI_ROUTES.yesno,
                             AI_PROVIDER_ORDER: normalizeAiProviderOrder(kvConfig.AI_ROUTES.yesno.AI_PROVIDER_ORDER, config.USE_LOCAL_AI)
                         } : undefined
                     };
                 }
             }
        } catch (error) {
            console.error("Lỗi đọc SYSTEM_CONFIG từ KV:", error);
        }
    }

    return config;
}
