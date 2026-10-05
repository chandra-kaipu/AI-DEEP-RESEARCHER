"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callLlm = callLlm;
exports.analyzeTrends = analyzeTrends;
exports.generateSummary = generateSummary;
exports.generateMindmap = generateMindmap;
exports.groundedChat = groundedChat;
exports.explainText = explainText;
exports.analyzeFileToChart = analyzeFileToChart;
exports.analyzeWebActivity = analyzeWebActivity;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const openai_1 = __importDefault(require("openai"));
const axios_1 = __importDefault(require("axios"));
const keys_js_1 = require("../routes/keys.js");
function getLlmClient(customKey, customProvider) {
    const apiKey = customKey || keys_js_1.runtimeKeys.llmKey || process.env.LLM_API_KEY;
    if (!apiKey) {
        throw new Error('MISSING_KEY:LLM_API_KEY: Please set LLM_API_KEY in your environment variables, Replit Secrets, or via the Settings modal.');
    }
    let provider = (customProvider || keys_js_1.runtimeKeys.llmProvider || process.env.LLM_PROVIDER || '').toLowerCase();
    // Auto-detect based on key format
    if (apiKey.startsWith('sk-or-') || provider === 'openrouter') {
        provider = 'openrouter';
    }
    else if (apiKey.startsWith('AIzaSy') || apiKey.toLowerCase().startsWith('aq') || provider === 'gemini' || provider === 'google') {
        provider = 'gemini';
    }
    else if (apiKey.startsWith('sk-ant-')) {
        provider = 'anthropic';
    }
    else if (apiKey.startsWith('sk-') || apiKey.startsWith('org-')) {
        provider = 'openai';
    }
    else if (!provider) {
        provider = 'openai';
    }
    if (provider === 'openrouter') {
        return {
            provider: 'openrouter',
            client: new openai_1.default({
                apiKey,
                baseURL: 'https://openrouter.ai/api/v1',
                defaultHeaders: {
                    'HTTP-Referer': 'https://ai-deep-researcher.edu',
                    'X-Title': 'AI Deep Researcher',
                },
            }),
            apiKey,
        };
    }
    else if (provider === 'anthropic') {
        return {
            provider: 'anthropic',
            client: new sdk_1.default({ apiKey }),
            apiKey,
        };
    }
    else if (provider === 'openai') {
        return {
            provider: 'openai',
            client: new openai_1.default({ apiKey }),
            apiKey,
        };
    }
    else if (provider === 'gemini') {
        return {
            provider: 'gemini',
            client: null,
            apiKey,
        };
    }
    else {
        throw new Error(`Unsupported LLM provider: ${provider}. Supported providers: gemini, openrouter, openai, anthropic.`);
    }
}
const VERIFIED_WORKING_MODELS = [
    'gemini-flash-lite-latest',
    'gemini-3.5-flash-lite',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview',
    'gemma-4-26b-a4b-it',
    'gemini-3.8-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
];
// Disallowed patterns: Non-text generation models (e.g. TTS, Image, Audio) that return 400 on text generation
const EXCLUDED_PATTERNS = [
    'tts',
    'audio',
    'transcribe',
    'clip',
    'image',
    'imagen',
    'embedding',
    'embed',
    'realtime',
    'moderation',
];
let cachedGeminiModels = null;
async function resolveGeminiModels(apiKey) {
    if (cachedGeminiModels && cachedGeminiModels.length > 0) {
        return cachedGeminiModels;
    }
    try {
        console.log(`Querying Google Generative Language API ListModels for key (${apiKey.slice(0, 6)}...${apiKey.slice(-4)})...`);
        const listRes = await axios_1.default.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, { timeout: 10000 });
        const rawModels = listRes.data?.models || [];
        const available = rawModels
            .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m) => m.name.replace(/^models\//, ''))
            .filter((name) => {
            const lower = name.toLowerCase();
            return !EXCLUDED_PATTERNS.some((pat) => lower.includes(pat));
        });
        console.log('Discovered supported Gemini text models for key:', available);
        if (available.length > 0) {
            // Prioritize verified working models first, preserving their precedence order
            const verified = VERIFIED_WORKING_MODELS.filter((m) => available.includes(m));
            const remainingFlashLite = available.filter((m) => !verified.includes(m) && (m.includes('flash-lite') || m.includes('flash_lite')));
            const remainingFlash = available.filter((m) => !verified.includes(m) && !remainingFlashLite.includes(m) && m.includes('flash'));
            const remainingGemma = available.filter((m) => !verified.includes(m) && !remainingFlashLite.includes(m) && !remainingFlash.includes(m) && m.includes('gemma'));
            const remainingPro = available.filter((m) => !verified.includes(m) && !remainingFlashLite.includes(m) && !remainingFlash.includes(m) && !remainingGemma.includes(m) && m.includes('pro'));
            const others = available.filter((m) => !verified.includes(m) &&
                !remainingFlashLite.includes(m) &&
                !remainingFlash.includes(m) &&
                !remainingGemma.includes(m) &&
                !remainingPro.includes(m));
            cachedGeminiModels = [
                ...verified,
                ...remainingFlashLite,
                ...remainingFlash,
                ...remainingGemma,
                ...remainingPro,
                ...others,
            ];
            console.log('Final prioritized Gemini candidate chain:', cachedGeminiModels.slice(0, 8));
            return cachedGeminiModels;
        }
    }
    catch (err) {
        console.warn('Could not list Gemini models from v1beta:', err.response?.status, JSON.stringify(err.response?.data || err.message));
    }
    // Fallback candidate list if ListModels is blocked or unavailable
    return [
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3-flash-preview',
        'gemma-4-26b-a4b-it',
        'gemini-3.8-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro',
    ];
}
async function callLlm(prompt, systemPrompt, customKey, customProvider, jsonMode = false) {
    const { provider, client, apiKey } = getLlmClient(customKey, customProvider);
    try {
        if (provider === 'gemini') {
            const candidateModels = await resolveGeminiModels(apiKey);
            let lastErr = null;
            for (const modelName of candidateModels) {
                // Try v1beta first, then v1
                const apiVersions = ['v1beta', 'v1'];
                for (const apiVer of apiVersions) {
                    try {
                        const genConfig = {
                            temperature: 0.3,
                        };
                        // Gemma models return 400 if responseMimeType is specified
                        if (jsonMode && !modelName.toLowerCase().includes('gemma')) {
                            genConfig.responseMimeType = 'application/json';
                        }
                        const response = await axios_1.default.post(`https://generativelanguage.googleapis.com/${apiVer}/models/${modelName}:generateContent?key=${apiKey}`, {
                            contents: [
                                {
                                    parts: [{ text: `${systemPrompt}\n\n${prompt}` }],
                                },
                            ],
                            generationConfig: genConfig,
                        }, { headers: { 'Content-Type': 'application/json' }, timeout: 35000 });
                        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
                    }
                    catch (mErr) {
                        lastErr = mErr;
                        const status = mErr.response?.status || mErr.status;
                        const errMsg = mErr.response?.data?.error?.message || mErr.message || '';
                        const lowerMsg = errMsg.toLowerCase();
                        // Fail fast ONLY on fatal authentication rejections
                        if (status === 401 ||
                            (status === 403 && (lowerMsg.includes('api key not valid') || lowerMsg.includes('forbidden') || lowerMsg.includes('permission_denied')))) {
                            throw mErr;
                        }
                        // Retryable/candidate-specific errors: 400 (unsupported config/TTS), 404 (model deprecated), 429 (quota tier limit), 503 (high demand)
                        console.warn(`Gemini (${apiVer}) model ${modelName} returned status ${status}: ${errMsg}. Rolling over to next candidate...`);
                        continue;
                    }
                }
            }
            throw lastErr || new Error('All Gemini model candidates failed.');
        }
        else if (provider === 'anthropic') {
            const anthropic = client;
            const model = 'claude-3-5-sonnet-20241022';
            const response = await anthropic.messages.create({
                model,
                max_tokens: 4096,
                temperature: 0.3,
                system: systemPrompt + (jsonMode ? '\nIMPORTANT: Output ONLY valid, parseable JSON without markdown ticks or preambles.' : ''),
                messages: [{ role: 'user', content: prompt }],
            });
            const block = response.content[0];
            if (block.type === 'text') {
                return block.text.trim();
            }
            return '';
        }
        else if (provider === 'openrouter') {
            const openrouter = client;
            const candidates = [
                process.env.OPENROUTER_MODEL,
                'anthropic/claude-3.5-sonnet',
                'deepseek/deepseek-chat',
                'google/gemini-2.0-flash-exp:free',
                'meta-llama/llama-3.3-70b-instruct:free',
                'openai/gpt-4o-mini',
            ].filter(Boolean);
            let lastErr = null;
            for (const m of candidates) {
                try {
                    const response = await openrouter.chat.completions.create({
                        model: m,
                        temperature: 0.3,
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt },
                        ],
                        response_format: jsonMode ? { type: 'json_object' } : undefined,
                    });
                    const content = response.choices[0]?.message?.content?.trim() || '';
                    if (content)
                        return content;
                }
                catch (mErr) {
                    lastErr = mErr;
                    console.warn(`OpenRouter model ${m} failed:`, mErr.message);
                    continue;
                }
            }
            throw lastErr || new Error('All OpenRouter model candidates failed.');
        }
        else {
            const openai = client;
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                temperature: 0.3,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: prompt },
                ],
                response_format: jsonMode ? { type: 'json_object' } : undefined,
            });
            return response.choices[0]?.message?.content?.trim() || '';
        }
    }
    catch (err) {
        const status = err.response?.status || err.status;
        const msg = (err.response?.data?.error?.message || err.message || '').toLowerCase();
        if (status === 401 || status === 403 || msg.includes('401') || msg.includes('invalid_api_key') || msg.includes('api key not valid')) {
            throw new Error(`AUTH_ERROR:LLM_API_KEY: Your ${provider.toUpperCase()} API key was rejected (${status || 'Unauthorized'}). Please verify your key in the API Keys modal.`);
        }
        if (status === 429 || msg.includes('429') || msg.includes('credits remaining') || msg.includes('quota') || msg.includes('resource_exhausted')) {
            throw new Error(`QUOTA_ERROR: Your ${provider.toUpperCase()} account has no credits remaining (429 Quota Exceeded). Please add credits or supply a valid Google Gemini key.`);
        }
        if (status === 404) {
            throw new Error(`API_ERROR: Model endpoint returned 404. ${err.response?.data?.error?.message || 'Check model availability on your key.'}`);
        }
        throw err;
    }
}
function parseJsonFromLlm(raw, fallback) {
    try {
        let clean = raw.trim();
        // 1. Direct parse attempt
        try {
            return JSON.parse(clean);
        }
        catch { }
        // 2. Extract from markdown code fence ```json ... ``` or ``` ... ```
        const fenceMatch = clean.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (fenceMatch && fenceMatch[1]) {
            try {
                return JSON.parse(fenceMatch[1].trim());
            }
            catch { }
        }
        // 3. Extract outermost JSON object or array
        const jsonMatch = clean.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
        if (jsonMatch && jsonMatch[1]) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            }
            catch { }
        }
        return fallback;
    }
    catch (err) {
        console.error('Failed to parse LLM JSON output:', err, raw);
        return fallback;
    }
}
function buildCorpusContext(sources) {
    return sources
        .map((s, i) => `[Source ${i + 1}] Title: ${s.title}\nURL: ${s.url}\nDomain: ${s.domain || 'unknown'} (${s.credibilityType || 'general'})\nContent:\n${s.fullText?.slice(0, 2000) || s.snippet}\n`)
        .join('\n---\n\n');
}
async function analyzeTrends(topic, sources, customKey, customProvider) {
    const corpus = buildCorpusContext(sources);
    const systemPrompt = `You are a Principal Research Analyst and Quantitative Synthesizer.
Analyze the provided live web search corpus for the given topic. You must ground all momentum scores and themes directly in the evidence provided.

Return a JSON object adhering to this TypeScript structure:
{
  "overview": "2-3 sentences synthesizing the market/intellectual momentum",
  "subtopics": [
    {
      "name": "Subtopic or technology or key vector",
      "momentumScore": 85, // number 0-100 indicating momentum/traction from sources
      "sentiment": "positive" | "neutral" | "negative",
      "sentimentScore": 0.75, // float -1.0 to 1.0
      "stage": "emerging" | "accelerating" | "maturing" | "declining",
      "keyDrivers": ["driver 1", "driver 2"],
      "sourceUrls": ["URL 1", "URL 2"]
    }
  ],
  "timeline": [
    {
      "period": "2023",
      "mentions": 15,
      "sentiment": 0.4
    },
    {
      "period": "2024",
      "mentions": 35,
      "sentiment": 0.6
    },
    {
      "period": "2025",
      "mentions": 58,
      "sentiment": 0.75
    },
    {
      "period": "2026",
      "mentions": 85,
      "sentiment": 0.8
    }
  ],
  "emergingThemes": ["theme 1", "theme 2", "theme 3"],
  "decliningThemes": ["theme 1", "theme 2"],
  "riskFactors": ["risk 1", "risk 2"],
  "unresolvedDebates": ["debate 1", "debate 2"]
}
Include between 4 and 8 subtopics.`;
    const prompt = `Topic: "${topic}"\n\nFetched Live Web Corpus:\n${corpus}\n\nPerform rigorous trend analysis and return pure JSON.`;
    const rawJson = await callLlm(prompt, systemPrompt, customKey, customProvider, true);
    return parseJsonFromLlm(rawJson, {
        overview: `Analysis of ${topic} based on ${sources.length} sources.`,
        subtopics: [],
        timeline: [],
        emergingThemes: [],
        decliningThemes: [],
        riskFactors: [],
        unresolvedDebates: [],
    });
}
async function generateSummary(topic, sources, language = 'en', customKey, customProvider) {
    const corpus = buildCorpusContext(sources);
    const systemPrompt = `You are a Senior Research Scholar and Science Editor.
Synthesize a deep, comprehensive research briefing on the topic based strictly on the provided web sources.
Include:
1. executiveSummary: Rigorous editorial overview (~200-300 words).
2. detailedSections: 3 to 5 thematic sections, each with a clear heading, deep analytic paragraphs, and citations referencing the exact source URLs.
3. summary_basic: An "Explain Like I'm 5" (ELI5) plain-language version without jargon or complex terminology, clear and engaging for anyone.
4. takeaways: 4 to 6 punchy bullet points of actionable intelligence.
5. All text should be written in language: "${language}".

Return a JSON object adhering to this structure:
{
  "topic": "${topic}",
  "language": "${language}",
  "executiveSummary": "...",
  "detailedSections": [
    {
      "heading": "...",
      "content": "markdown formatted text with [Source Title](URL) references",
      "citations": ["URL 1", "URL 2"]
    }
  ],
  "summary_basic": "...",
  "takeaways": ["point 1", "point 2"]
}`;
    const prompt = `Topic: "${topic}"\nLanguage: "${language}"\n\nFetched Live Corpus:\n${corpus}\n\nProduce the complete editorial briefing and basic language summary in JSON.`;
    const rawJson = await callLlm(prompt, systemPrompt, customKey, customProvider, true);
    return parseJsonFromLlm(rawJson, {
        topic,
        language,
        executiveSummary: `Synthesis for ${topic}`,
        detailedSections: [],
        summary_basic: `Simple summary for ${topic}`,
        takeaways: [],
    });
}
async function generateMindmap(topic, sources, customKey, customProvider) {
    const corpus = buildCorpusContext(sources);
    const systemPrompt = `You are an Information Architect.
Create a hierarchical Mindmap structure for the research topic based on the provided corpus.
The tree should have:
- 1 Root node (the topic itself)
- 3 to 6 Category branches (major domains, architectural pillars, market forces, or scientific fundamentals)
- Each Category branch must have 2 to 4 Sub-branches (concrete technologies, debates, methodologies, or findings)

Return a JSON object adhering to this structure:
{
  "id": "root",
  "label": "${topic}",
  "type": "root",
  "summarySnippet": "Core research focal point",
  "children": [
    {
      "id": "cat-1",
      "label": "Category Name",
      "type": "category",
      "summarySnippet": "...",
      "children": [
        {
          "id": "detail-1-1",
          "label": "Specific Element / Technology",
          "type": "detail",
          "summarySnippet": "..."
        }
      ]
    }
  ]
}`;
    const prompt = `Topic: "${topic}"\n\nCorpus:\n${corpus}\n\nGenerate the complete hierarchical mindmap tree in JSON.`;
    const rawJson = await callLlm(prompt, systemPrompt, customKey, customProvider, true);
    return parseJsonFromLlm(rawJson, {
        id: 'root',
        label: topic,
        type: 'root',
        children: [],
    });
}
async function groundedChat(topic, sources, messages, customKey, customProvider) {
    const corpus = buildCorpusContext(sources);
    const systemPrompt = `You are an AI Deep Research Assistant.
Answer the user's question using ONLY the provided research corpus from the live web search on "${topic}".
If the information is not present in the sources, politely clarify that the current fetched research corpus does not cover that specific detail.
Always refer to sources by their title or URL when making assertions.`;
    const conversationHistory = messages
        .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
        .join('\n\n');
    const prompt = `Research Topic: "${topic}"\n\nFetched Corpus:\n${corpus}\n\nConversation:\n${conversationHistory}\n\nASSISTANT:`;
    const reply = await callLlm(prompt, systemPrompt, customKey, customProvider, false);
    // Extract matching citations from corpus referenced in reply
    const citations = [];
    for (const source of sources) {
        if (reply.toLowerCase().includes(source.title.toLowerCase().slice(0, 20)) || reply.includes(source.url)) {
            citations.push({
                url: source.url,
                title: source.title,
                snippet: source.snippet.slice(0, 150),
            });
        }
    }
    return { reply, citations };
}
async function explainText(text, instructions, customKey, customProvider) {
    const systemPrompt = `You are a World-Class Educator, Technical Synthesizer, and Polymath.
The user has provided a dense, complex, or technical text that needs to be DEEPLY EXPLAINED, NOT JUST READ OR SUMMARIZED.
You must deconstruct the concept from first principles, illuminate hidden assumptions, build vivid mental models, and make every technical nuance intuitive.

Return a JSON object adhering strictly to this TypeScript structure:
{
  "title": "Clear, engaging title for the concept",
  "summary": "2-3 crisp sentences articulating the core idea and why it matters",
  "intuitiveAnalogy": {
    "analogy": "A memorable, vivid real-world metaphor (e.g. comparing distributed consensus to a group of friends ordering dinner, or compiler passes to a conveyor belt assembly line)",
    "explanation": "2-3 sentences explaining exactly how the metaphor maps to the mechanics of the subject"
  },
  "coreMechanisms": [
    {
      "step": 1,
      "title": "Mechanism or Step Name",
      "description": "In-depth explanation of how this piece operates under the hood"
    }
  ],
  "technicalGlossary": [
    {
      "term": "Key Jargon Term",
      "plainEnglish": "What it actually means without academic gatekeeping"
    }
  ],
  "assumptionsAndCaveats": [
    "Underlying presupposition or trade-off",
    "Where this breaks down or fails in practice",
    "Edge case or boundary condition"
  ],
  "practicalExample": {
    "scenario": "A realistic, concrete real-world use case or scenario",
    "outcome": "How the concept directly shapes the final result in that scenario"
  },
  "keyTakeaways": [
    "Punchy, memorable takeaway 1",
    "Punchy, memorable takeaway 2",
    "Punchy, memorable takeaway 3"
  ]
}
Include 3 to 5 core mechanisms, 3 to 6 glossary terms, 3 to 4 caveats, and 3 to 5 key takeaways.`;
    const prompt = `Text to Explain:${instructions ? `\nSpecial Instructions: ${instructions}\n` : ''}\n\n${text.slice(0, 12000)}\n\nExplain this text deeply and return pure JSON.`;
    const rawJson = await callLlm(prompt, systemPrompt, customKey, customProvider, true);
    return parseJsonFromLlm(rawJson, {
        title: 'Text Analysis & Explanation',
        summary: 'Comprehensive breakdown of the provided text.',
        intuitiveAnalogy: {
            analogy: 'A systemic bridge connecting theory to application.',
            explanation: 'Translates dense statements into structured conceptual understanding.',
        },
        coreMechanisms: [
            { step: 1, title: 'Foundational Premise', description: 'The fundamental argument presented in the document.' }
        ],
        technicalGlossary: [],
        assumptionsAndCaveats: ['Requires contextual domain knowledge for edge cases.'],
        practicalExample: { scenario: 'Direct implementation in study or engineering.', outcome: 'Clear, reproducible execution.' },
        keyTakeaways: ['High information density requires layered decomposition.'],
    });
}
async function analyzeFileToChart(parsedData, chartGoal, customKey, customProvider) {
    const summaryPayload = {
        fileName: parsedData.fileName,
        fileType: parsedData.fileType,
        rowCount: parsedData.rowCount,
        columns: parsedData.columns,
        columnTypes: parsedData.columnTypes,
        numericSummary: parsedData.numericSummary,
        sampleRows: parsedData.sampleRows.slice(0, 8),
    };
    const systemPrompt = `You are a Chief Data Scientist and Information Designer.
Given the schema, statistics, and sample rows from an uploaded data file (${parsedData.fileName}), formulate the single most compelling, actionable visualization.
Clean, aggregate, or select up to 15 data points so that Recharts renders cleanly with readable labels and balanced bars/lines/points.

Return a JSON object adhering strictly to this TypeScript structure:
{
  "chartType": "bar" | "line" | "area" | "pie" | "radar",
  "title": "Crisp, insightful chart title",
  "subtitle": "Brief subtitle explaining the metric and dimension",
  "xAxisKey": "string (the exact property name in data objects for the X-axis or category)",
  "yAxisKeys": [
    {
      "key": "string (property name in data objects for numeric metric)",
      "color": "#D97757" (or #2B3A4A, #10B981, #6366F1, #F59E0B),
      "label": "Human readable label"
    }
  ],
  "data": [
    {
      "[xAxisKey]": "Category A",
      "[metricKey]": 120.5
    }
  ],
  "insights": [
    "Analytical insight 1 based on the data trends or distributions",
    "Analytical insight 2 identifying high-performance or outliers",
    "Analytical insight 3 providing strategic recommendations"
  ],
  "summaryStats": {
    "totalRows": ${parsedData.rowCount},
    "visualizedMetrics": ["Metric Name 1"],
    "observation": "Key observation summarizing the distribution"
  },
  "alternativeChartTypes": ["bar", "line", "area"]
}
Limit "data" array to at most 15 items so the chart is clean, beautiful, and uncrowded.`;
    const prompt = `Data Summary from File "${parsedData.fileName}":
${JSON.stringify(summaryPayload, null, 2)}

${chartGoal ? `User's Specific Visualization Goal: "${chartGoal}"` : 'Choose the best analytical visualization.'}

Generate the optimal chart configuration and aggregated data array in pure JSON.`;
    const rawJson = await callLlm(prompt, systemPrompt, customKey, customProvider, true);
    return parseJsonFromLlm(rawJson, {
        chartType: 'bar',
        title: `Data Distribution for ${parsedData.fileName}`,
        subtitle: `Visualizing ${parsedData.columns.slice(0, 2).join(' by ')}`,
        xAxisKey: parsedData.columns[0] || 'category',
        yAxisKeys: [
            { key: Object.keys(parsedData.numericSummary)[0] || 'value', color: '#D97757', label: 'Metric' }
        ],
        data: parsedData.sampleRows.slice(0, 10).map((r, i) => ({
            [parsedData.columns[0] || 'category']: r[parsedData.columns[0]] || `Row ${i + 1}`,
            [Object.keys(parsedData.numericSummary)[0] || 'value']: Number(r[Object.keys(parsedData.numericSummary)[0]]) || (i + 1) * 10,
        })),
        insights: [`Total of ${parsedData.rowCount} records analyzed across ${parsedData.columns.length} attributes.`],
        summaryStats: {
            totalRows: parsedData.rowCount,
            visualizedMetrics: [Object.keys(parsedData.numericSummary)[0] || 'Count'],
            observation: 'Overview of sample row distributions.',
        },
        alternativeChartTypes: ['line', 'area'],
    });
}
async function analyzeWebActivity(url, pageData, customKey, customProvider) {
    const systemPrompt = `You are a Principal Tech Analyst, Digital Strategist, and Web Auditor.
Evaluate the provided live scraped website data and perform an in-depth intelligence audit of this web property and its activities.

Return a JSON object adhering strictly to this TypeScript structure:
{
  "url": "${url}",
  "siteOverview": "Executive summary of what this website/business/platform does and its primary value proposition (2-3 sentences)",
  "targetAudience": "Precise demographic, customer profile, or industry persona targeted by this site",
  "activityScore": 88, // integer from 0 to 100 assessing the site's digital vitality, modern execution, and market activity
  "businessModel": "Clear explanation of how they create and capture value (e.g. B2B SaaS, Transactional Marketplace, Open Source + Enterprise Cloud, Direct-to-Consumer)",
  "coreOfferings": [
    "Primary product or service offering 1",
    "Primary product or service offering 2",
    "Primary product or service offering 3"
  ],
  "techStackIndicators": [
    "Detected or inferred technology/framework/API (e.g. Next.js, Stripe, TailwindCSS, Cloudflare, AI LLM wrapper, etc.)"
  ],
  "strengths": [
    "Competitive advantage or strong UX/strategic point 1",
    "Competitive advantage 2",
    "Competitive advantage 3"
  ],
  "vulnerabilities": [
    "Weak point, unaddressed market risk, or missing capability 1",
    "Weak point or risk 2"
  ],
  "strategicVerdict": "2-3 sentence strategic verdict on their current positioning, viability, and future trajectory"
}`;
    const prompt = `Target URL: ${url}
Page Title: ${pageData.title}
Meta Description: ${pageData.metaDescription}
Headings Sample: ${pageData.headings.slice(0, 15).join(' | ')}
Key Outbound/Internal Links: ${pageData.links.slice(0, 12).join(', ')}
Scraped Content Sample:
${pageData.textSample.slice(0, 5000)}

Perform the complete web intelligence audit and return pure JSON.`;
    const rawJson = await callLlm(prompt, systemPrompt, customKey, customProvider, true);
    return parseJsonFromLlm(rawJson, {
        url,
        siteOverview: `Digital web property operating at ${url}`,
        targetAudience: 'General digital audience and consumers',
        activityScore: 75,
        businessModel: 'Digital services or web presence',
        coreOfferings: ['Web service or informational platform'],
        techStackIndicators: ['Modern Web Architecture'],
        strengths: ['Active online presence'],
        vulnerabilities: ['Further domain verification recommended'],
        strategicVerdict: `Operational web destination at ${url}.`,
    });
}
