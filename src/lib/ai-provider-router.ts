import type { SystemConfig } from './config';
import { normalizeAiProviderOrder } from './config';

type WorkerRunner = () => Promise<any>;

interface RunProviderChainOptions {
    config: SystemConfig;
    webhookUrl?: string;
    webhookLabel: string;
    payload: any;
    runWorker: WorkerRunner;
}

export function getEnabledAiProviders(config: SystemConfig) {
    return normalizeAiProviderOrder(config.AI_PROVIDER_ORDER, config.USE_LOCAL_AI);
}

export function hasEnabledProvider(config: SystemConfig, provider: 'n8n' | 'router' | 'openai') {
    return getEnabledAiProviders(config).includes(provider);
}

export async function runAiProviderChain(options: RunProviderChainOptions) {
    const providers = getEnabledAiProviders(options.config);
    const failures: string[] = [];

    if (providers.length === 0) {
        throw new Error('Chưa bật luồng AI nào trong CMS.');
    }

    if (providers.includes('n8n')) {
        if (!options.webhookUrl) {
            failures.push('n8n: thiếu webhook URL');
        } else {
            try {
                const response = await fetch(options.webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(options.payload)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const responseText = await response.text();
                try {
                    return JSON.parse(responseText);
                } catch {
                    throw new Error('phản hồi không phải JSON');
                }
            } catch (error: any) {
                const reason = error?.message || String(error);
                console.warn(`[AI ROUTER] ${options.webhookLabel} n8n failed: ${reason}`);
                failures.push(`n8n: ${reason}`);
            }
        }
    }

    if (providers.includes('router') || providers.includes('openai')) {
        try {
            return await options.runWorker();
        } catch (error: any) {
            const reason = error?.message || String(error);
            console.warn(`[AI ROUTER] internal AI failed: ${reason}`);
            failures.push(`internal: ${reason}`);
        }
    }

    throw new Error(`Tất cả luồng AI được bật đều lỗi. ${failures.join(' | ')}`);
}
