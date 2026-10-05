"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResearchImage = generateResearchImage;
const openai_1 = __importDefault(require("openai"));
const axios_1 = __importDefault(require("axios"));
const keys_js_1 = require("../routes/keys.js");
async function generateResearchImage(topic, summaryExcerpt, customKey, customProvider) {
    const provider = (customProvider || keys_js_1.runtimeKeys.imageProvider || process.env.IMAGE_PROVIDER || 'openai').toLowerCase();
    const apiKey = customKey || keys_js_1.runtimeKeys.imageKey || keys_js_1.runtimeKeys.llmKey || process.env.IMAGE_API_KEY || process.env.LLM_API_KEY;
    if (!apiKey) {
        throw new Error('MISSING_KEY:IMAGE_API_KEY: Please set IMAGE_API_KEY or LLM_API_KEY in your environment, Replit Secrets, or via the Settings modal.');
    }
    // Create an editorial, conceptual art prompt that reflects the research topic and terracotta/cream aesthetic
    const visualPrompt = `An elegant, editorial concept illustration for a serious research publication on "${topic}". Warm paper cream background (#F5F2EA), accents of terracotta clay (#D97757) and muted sage green (#8C9C7C). Minimalist, sophisticated scientific diagrammatic art style, thoughtful visual metaphors, no garish colors, high resolution, museum quality. Context: ${summaryExcerpt.slice(0, 200)}.`;
    if (provider === 'openai' && apiKey && (apiKey.startsWith('sk-') || apiKey.startsWith('org-'))) {
        const openai = new openai_1.default({ apiKey });
        try {
            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt: visualPrompt,
                n: 1,
                size: '1024x1024',
                quality: 'standard',
                style: 'natural',
            });
            const dataItem = response.data?.[0];
            const imageUrl = dataItem?.url || '';
            const revisedPrompt = dataItem?.revised_prompt || visualPrompt;
            return {
                imageUrl,
                revisedPrompt,
                provider: 'OpenAI DALL-E 3',
            };
        }
        catch (err) {
            console.warn('[ImageProvider] DALL-E 3 failed, attempting DALL-E 2 / Horde fallback:', err.message);
            try {
                const response2 = await openai.images.generate({
                    model: 'dall-e-2',
                    prompt: visualPrompt.slice(0, 1000),
                    n: 1,
                    size: '512x512',
                });
                return {
                    imageUrl: response2.data?.[0]?.url || '',
                    revisedPrompt: visualPrompt,
                    provider: 'OpenAI DALL-E 2',
                };
            }
            catch (err2) {
                console.warn('[ImageProvider] OpenAI image generation failed, falling back to AI Horde:', err2.message);
            }
        }
    }
    else if (provider === 'stability' && apiKey) {
        try {
            const response = await axios_1.default.post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
                text_prompts: [
                    { text: visualPrompt, weight: 1 },
                    { text: 'ugly, blurry, low quality, neon, oversaturated', weight: -1 },
                ],
                cfg_scale: 7,
                height: 1024,
                width: 1024,
                steps: 30,
                samples: 1,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                timeout: 15000,
            });
            const artifact = response.data.artifacts[0];
            const imageUrl = `data:image/png;base64,${artifact.base64}`;
            return {
                imageUrl,
                revisedPrompt: visualPrompt,
                provider: 'Stability AI SDXL',
            };
        }
        catch (stabErr) {
            console.warn('[ImageProvider] Stability failed, falling back to AI Horde:', stabErr.message);
        }
    }
    // Universal Generative Fallback: AI Horde Stable Diffusion Cluster
    try {
        const hordeRes = await axios_1.default.post('https://stablehorde.net/api/v2/generate/async', {
            prompt: `${topic}, scientific diagrammatic editorial concept, clean aesthetic, high resolution`,
            params: { steps: 16, width: 512, height: 512, n: 1, sampler_name: 'k_euler' },
        }, { headers: { apikey: '0000000000', 'Content-Type': 'application/json' }, timeout: 8000 });
        const hordeId = hordeRes.data?.id;
        if (hordeId) {
            for (let i = 0; i < 7; i++) {
                await new Promise((r) => setTimeout(r, 1500));
                const statusRes = await axios_1.default.get(`https://stablehorde.net/api/v2/generate/status/${hordeId}`, { timeout: 6000 });
                if (statusRes.data?.done && statusRes.data?.generations?.length > 0) {
                    const rawUrl = statusRes.data.generations[0].img;
                    const dlRes = await axios_1.default.get(rawUrl, { responseType: 'arraybuffer', timeout: 8000 });
                    const mime = dlRes.headers['content-type'] || 'image/webp';
                    return {
                        imageUrl: `data:${mime};base64,${Buffer.from(dlRes.data).toString('base64')}`,
                        revisedPrompt: visualPrompt,
                        provider: 'Stable Diffusion (AI Horde)',
                    };
                }
            }
        }
    }
    catch (hordeErr) {
        console.warn('[ImageProvider] AI Horde fallback timed out/failed:', hordeErr.message);
    }
    // Guaranteed Procedural SVG Fallback
    const hash = topic.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const hue = hash % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <rect width="1024" height="1024" fill="#FAF7F0"/>
    <circle cx="512" cy="460" r="280" fill="hsl(${hue}, 60%, 88%)" opacity="0.7"/>
    <circle cx="512" cy="460" r="180" fill="#D97757" opacity="0.2"/>
    <g stroke="#1B2A32" stroke-width="2" opacity="0.3" fill="none">
      <circle cx="512" cy="460" r="240"/>
      <line x1="200" y1="460" x2="824" y2="460"/>
      <line x1="512" y1="140" x2="512" y2="780"/>
    </g>
    <text x="512" y="860" font-family="system-ui, serif" font-size="28" font-weight="bold" fill="#1B2A32" text-anchor="middle">
      ${topic.slice(0, 45).replace(/["<>&]/g, '')}
    </text>
    <text x="512" y="905" font-family="monospace" font-size="14" fill="#D97757" text-anchor="middle" letter-spacing="2">
      RESEARCH SYNTHESIS CONCEPT
    </text>
  </svg>`;
    return {
        imageUrl: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
        revisedPrompt: visualPrompt,
        provider: 'Editorial Procedural Concept',
    };
}
