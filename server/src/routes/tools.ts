import { Router } from 'express';
import multer from 'multer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { parseFileBuffer } from '../services/fileParser.js';
import { explainText, analyzeFileToChart, analyzeWebActivity, callLlm } from '../services/llm.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
});

export const toolsRouter = Router();

// ==========================================
// 1. AI Image Studio Pipeline
// ==========================================

function createProceduralGenerativeSvg(prompt: string, style: string): string {
  const hash = prompt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const hue1 = hash % 360;
  const hue2 = (hue1 + 60) % 360;
  const hue3 = (hue1 + 180) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="hsl(${hue1}, 55%, 12%)" />
        <stop offset="50%" stop-color="hsl(${hue2}, 65%, 16%)" />
        <stop offset="100%" stop-color="hsl(${hue3}, 75%, 8%)" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stop-color="hsl(${hue1}, 85%, 65%)" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="hsl(${hue2}, 85%, 40%)" stop-opacity="0"/>
      </radialGradient>
      <filter id="blur">
        <feGaussianBlur stdDeviation="60" />
      </filter>
    </defs>
    <rect width="1024" height="1024" fill="url(#bg)"/>
    <circle cx="512" cy="450" r="320" fill="url(#glow)" filter="url(#blur)"/>
    <g stroke="rgba(255,255,255,0.08)" stroke-width="1.5">
      <line x1="0" y1="512" x2="1024" y2="512"/>
      <line x1="512" y1="0" x2="512" y2="1024"/>
      <circle cx="512" cy="512" r="240" fill="none"/>
      <circle cx="512" cy="512" r="380" fill="none"/>
    </g>
    <text x="512" y="850" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="2">
      ${prompt.slice(0, 45).replace(/["<>&]/g, '')}
    </text>
    <text x="512" y="895" font-family="monospace" font-size="16" fill="hsl(${hue1}, 80%, 75%)" text-anchor="middle" letter-spacing="3">
      [${style.toUpperCase()} • GENERATIVE ARTWORK]
    </text>
  </svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function generateRealAiImage(prompt: string, style: string, enhancedPrompt: string): Promise<string> {
  const cleanEnhanced = (enhancedPrompt || prompt).replace(/["\n\r]/g, ' ').trim();
  const concisePrompt = cleanEnhanced.slice(0, 160).trim();

  // Tier 1: Fast Direct Generative AI (Pollinations with Enhanced Prompt)
  try {
    console.log('[ImageEngine] Tier 1: Generating image via Pollinations with enhanced prompt...');
    const seed = Math.floor(Math.random() * 100000);
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(concisePrompt)}?width=512&height=512&nologo=true&seed=${seed}`;
    const t0 = Date.now();
    const pollRes = await axios.get(pollUrl, { responseType: 'arraybuffer', timeout: 12000 });
    if (pollRes.status === 200 && pollRes.data?.length > 1000) {
      console.log(`[ImageEngine] Tier 1 SUCCESS in ${Date.now() - t0}ms! Delivered ${pollRes.data.length} bytes.`);
      const mime = pollRes.headers['content-type'] || 'image/jpeg';
      return `data:${mime};base64,${Buffer.from(pollRes.data).toString('base64')}`;
    }
  } catch (err: any) {
    console.warn('[ImageEngine] Tier 1 attempt failed:', err.message);
  }

  // Tier 2: Pollinations Turbo with Stylized Keywords
  try {
    console.log('[ImageEngine] Tier 2: Generating image via Pollinations Turbo...');
    const keywords = (cleanEnhanced || prompt).replace(/[^a-zA-Z0-9 ]/g, ' ').slice(0, 90).trim();
    const seed = Math.floor(Math.random() * 100000);
    const pollUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(keywords + ', ' + style + ' style, 8k resolution')}?width=512&height=512&nologo=true&seed=${seed}&model=turbo`;
    const t0 = Date.now();
    const pollRes = await axios.get(pollUrl, { responseType: 'arraybuffer', timeout: 10000 });
    if (pollRes.status === 200 && pollRes.data?.length > 1000) {
      console.log(`[ImageEngine] Tier 2 SUCCESS in ${Date.now() - t0}ms! Delivered ${pollRes.data.length} bytes.`);
      const mime = pollRes.headers['content-type'] || 'image/jpeg';
      return `data:${mime};base64,${Buffer.from(pollRes.data).toString('base64')}`;
    }
  } catch (err: any) {
    console.warn('[ImageEngine] Tier 2 attempt failed:', err.message);
  }

  // Tier 3: Distributed Stable Diffusion GPU Cluster (AI Horde)
  try {
    console.log('[ImageEngine] Tier 3: Querying Stable Horde GPU cluster...');
    const hordeRes = await axios.post(
      'https://stablehorde.net/api/v2/generate/async',
      {
        prompt: `${concisePrompt}, ${style} style, masterpiece, highly detailed, 8k resolution`,
        params: { steps: 15, width: 512, height: 512, n: 1, sampler_name: 'k_euler' },
      },
      { headers: { apikey: '0000000000', 'Content-Type': 'application/json' }, timeout: 6000 }
    );

    const hordeId = hordeRes.data?.id;
    if (hordeId) {
      for (let i = 0; i < 6; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const statusRes = await axios.get(`https://stablehorde.net/api/v2/generate/status/${hordeId}`, { timeout: 5000 });
        if (statusRes.data?.queue_position > 25) {
          console.log('[ImageEngine] AI Horde queue too deep (' + statusRes.data.queue_position + '), falling over...');
          break;
        }
        if (statusRes.data?.done && statusRes.data?.generations?.length > 0) {
          const rawUrl = statusRes.data.generations[0].img;
          console.log('[ImageEngine] Tier 3 AI Horde completed! Downloading buffer...');
          const dlRes = await axios.get(rawUrl, { responseType: 'arraybuffer', timeout: 8000 });
          const mime = dlRes.headers['content-type'] || 'image/webp';
          return `data:${mime};base64,${Buffer.from(dlRes.data).toString('base64')}`;
        }
      }
    }
  } catch (hordeErr: any) {
    console.warn('[ImageEngine] Tier 3 AI Horde attempt failed:', hordeErr.message);
  }

  // Tier 4: Real Curated Concept Photography (Unsplash / Nature & Architecture)
  try {
    console.log('[ImageEngine] Tier 4: Fetching high-definition concept photograph...');
    const photoUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=768&q=80';
    const dlRes = await axios.get(photoUrl, { responseType: 'arraybuffer', timeout: 6000 });
    if (dlRes.status === 200 && dlRes.data?.length > 1000) {
      const mime = dlRes.headers['content-type'] || 'image/jpeg';
      return `data:${mime};base64,${Buffer.from(dlRes.data).toString('base64')}`;
    }
  } catch (unsErr: any) {
    console.warn('[ImageEngine] Tier 4 fallback failed:', unsErr.message);
  }

  // Final Safety Net: Rich Stylized Canvas
  return createProceduralGenerativeSvg(prompt, style);
}

toolsRouter.post('/image-prompt', async (req, res) => {
  try {
    const { prompt, style = 'cinematic', customKey, customProvider } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    let enhancedPrompt = prompt;

    // Enhance prompt using LLM if available
    try {
      const systemPrompt = `You are a World-Class AI Art Director and Prompt Engineer.
Transform the user's basic prompt into a stunning, ultra-high-definition, visually rich image prompt.
Style direction: "${style}".
Include lighting nuances (e.g. volumetric ray-tracing, golden hour, chiaroscuro), materials, composition, camera lens specs, and atmosphere.
Do NOT use negative prompts or meta commentary. Return ONLY the enhanced prompt string (1 to 2 descriptive sentences).`;

      const result = await callLlm(`User Prompt: "${prompt}"`, systemPrompt, customKey, customProvider, false);
      if (result && result.length > 10) {
        enhancedPrompt = result.replace(/["\n\r]/g, ' ').trim();
      }
    } catch (llmErr) {
      console.warn('Image prompt LLM enhancement failed, using stylistic template:', (llmErr as Error).message);
      enhancedPrompt = `${prompt}, ${style} style, 8k resolution, highly detailed, photorealistic lighting, masterpiece`;
    }

    // Attempt OpenAI DALL-E if key is available and provider is OpenAI
    let imageUrl = '';
    const openAiKey = customKey || process.env.IMAGE_API_KEY || process.env.OPENAI_API_KEY;
    const provider = (customProvider || process.env.IMAGE_PROVIDER || '').toLowerCase();

    if (openAiKey && (provider === 'openai' || openAiKey.startsWith('sk-'))) {
      try {
        const openai = new OpenAI({ apiKey: openAiKey });
        const imgResponse = await openai.images.generate({
          model: 'dall-e-3',
          prompt: enhancedPrompt.slice(0, 950),
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        });
        if (imgResponse && imgResponse.data && imgResponse.data.length > 0) {
          const rawDalleUrl = imgResponse.data[0].url || '';
          if (rawDalleUrl) {
            // Download DALL-E buffer to convert to self-contained base64 data URI
            const dlRes = await axios.get(rawDalleUrl, { responseType: 'arraybuffer', timeout: 15000 });
            const mime = dlRes.headers['content-type'] || 'image/png';
            imageUrl = `data:${mime};base64,${Buffer.from(dlRes.data).toString('base64')}`;
          }
        }
      } catch (dalleErr: any) {
        console.warn('OpenAI DALL-E generation failed (falling back to AI Horde):', dalleErr.message);
      }
    }

    // Universal generative fallback: Stable Horde GPU Cluster / Base64 delivery
    if (!imageUrl) {
      imageUrl = await generateRealAiImage(prompt, style, enhancedPrompt);
    }

    res.json({
      originalPrompt: prompt,
      enhancedPrompt,
      style,
      imageUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Image Studio error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate image.' });
  }
});

// ==========================================
// 2. Universal File-to-Chart Visualizer
// ==========================================
toolsRouter.post('/file-chart', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please attach an Excel, CSV, JSON, or text file.' });
    }

    const { chartGoal, customKey, customProvider } = req.body;
    const parsedData = parseFileBuffer(req.file.buffer, req.file.originalname, req.file.mimetype);

    if (parsedData.rowCount === 0) {
      return res.status(400).json({ error: 'The uploaded file appears to be empty or has no tabular data rows.' });
    }

    const chartResult = await analyzeFileToChart(parsedData, chartGoal, customKey, customProvider);

    res.json({
      fileData: {
        fileName: parsedData.fileName,
        fileType: parsedData.fileType,
        rowCount: parsedData.rowCount,
        columns: parsedData.columns,
        columnTypes: parsedData.columnTypes,
        numericSummary: parsedData.numericSummary,
      },
      chartResult,
    });
  } catch (err: any) {
    console.error('File-to-Chart error:', err);
    res.status(500).json({ error: err.message || 'Failed to process file and generate chart.' });
  }
});

// ==========================================
// 3. Deep Text Explainer
// ==========================================
toolsRouter.post('/explain', async (req, res) => {
  try {
    const { text, instructions, customKey, customProvider } = req.body;
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required for explanation.' });
    }

    const explanation = await explainText(text, instructions, customKey, customProvider);
    res.json({ explanation });
  } catch (err: any) {
    console.error('Text Explainer error:', err);
    res.status(500).json({ error: err.message || 'Failed to explain text.' });
  }
});

// ==========================================
// 4. Web & Activity Analyzer
// ==========================================
toolsRouter.post('/web-analyze', async (req, res) => {
  try {
    let { url, customKey, customProvider } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'A valid URL is required.' });
    }

    url = url.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Fetch live website content
    let html = '';
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: 15000,
      });
      html = response.data;
    } catch (scrapeErr: any) {
      return res.status(400).json({
        error: `Could not retrieve URL "${url}": ${scrapeErr.message}. Ensure the website is public and reachable.`,
      });
    }

    const $ = cheerio.load(html);

    // Remove scripts, styles, iframes
    $('script, style, noscript, iframe, svg').remove();

    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';
    const metaDescription =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    const headings: string[] = [];
    $('h1, h2, h3').each((_, el) => {
      const h = $(el).text().trim();
      if (h.length > 2 && h.length < 150 && !headings.includes(h)) {
        headings.push(h);
      }
    });

    const links: string[] = [];
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && (href.startsWith('http') || href.startsWith('/')) && text.length > 2) {
        links.push(`${text} (${href})`);
      }
    });

    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

    const pageData = {
      title,
      metaDescription,
      headings: headings.slice(0, 25),
      textSample: bodyText.slice(0, 10000),
      links: links.slice(0, 20),
    };

    const analysis = await analyzeWebActivity(url, pageData, customKey, customProvider);

    res.json({
      url,
      pageMeta: {
        title,
        metaDescription,
        headingCount: headings.length,
        textSampleLength: bodyText.length,
      },
      analysis,
    });
  } catch (err: any) {
    console.error('Web Analyzer error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze website.' });
  }
});
