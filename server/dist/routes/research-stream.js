"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.researchStreamRouter = void 0;
const express_1 = require("express");
const searchProvider_js_1 = require("../services/searchProvider.js");
const extract_js_1 = require("../services/extract.js");
const llm_js_1 = require("../services/llm.js");
const imageProvider_js_1 = require("../services/imageProvider.js");
const keys_js_1 = require("./keys.js");
exports.researchStreamRouter = (0, express_1.Router)();
exports.researchStreamRouter.get('/', async (req, res) => {
    const topic = req.query.topic || '';
    const depth = req.query.depth || 'quick';
    const language = req.query.lang || 'en';
    // Set SSE Headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on proxies
    res.flushHeaders?.();
    const sendEvent = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };
    if (!topic || topic.trim().length === 0) {
        sendEvent('error', { message: 'Topic is required.' });
        return res.end();
    }
    try {
        // Stage 1: Live Web Search
        sendEvent('status', {
            stage: 'searching',
            step: 1,
            totalSteps: 6,
            message: `Searching live web for "${topic}" (${depth} depth)...`,
        });
        const searchKey = req.query.searchKey || keys_js_1.runtimeKeys.searchKey;
        const searchProvider = req.query.searchProvider || keys_js_1.runtimeKeys.searchProvider;
        const llmKey = req.query.llmKey || keys_js_1.runtimeKeys.llmKey;
        const llmProvider = req.query.llmProvider || keys_js_1.runtimeKeys.llmProvider;
        const imageKey = req.query.imageKey || keys_js_1.runtimeKeys.imageKey;
        const imageProvider = req.query.imageProvider || keys_js_1.runtimeKeys.imageProvider;
        let searchItems = [];
        try {
            searchItems = await (0, searchProvider_js_1.performWebSearch)(topic, depth, searchKey, searchProvider);
        }
        catch (searchErr) {
            if (searchErr.message.startsWith('MISSING_KEY:') || searchErr.message.startsWith('AUTH_ERROR:')) {
                sendEvent('missing_key', {
                    key: 'SEARCH_API_KEY',
                    message: searchErr.message,
                });
                sendEvent('error', { message: searchErr.message });
                return res.end();
            }
            throw searchErr;
        }
        // Stage 2: Web Scraping & Miscellaneous URL Extraction
        sendEvent('status', {
            stage: 'extracting',
            step: 2,
            totalSteps: 6,
            message: `Extracting content from ${searchItems.length} sources & discovering adjacent links...`,
        });
        const { extractedSources, relatedUrls } = await (0, extract_js_1.extractMultipleSources)(searchItems);
        sendEvent('sources', {
            sources: extractedSources,
            relatedUrls,
        });
        // Stage 3: Trend Analysis
        sendEvent('status', {
            stage: 'analyzing',
            step: 3,
            totalSteps: 6,
            message: 'Analyzing subtopic momentum, market sentiment, and emerging themes...',
        });
        let analysisResult = null;
        try {
            analysisResult = await (0, llm_js_1.analyzeTrends)(topic, extractedSources, llmKey, llmProvider);
            sendEvent('analysis', analysisResult);
        }
        catch (llmErr) {
            if (llmErr.message.startsWith('MISSING_KEY:')) {
                sendEvent('missing_key', {
                    key: 'LLM_API_KEY',
                    message: llmErr.message,
                });
            }
            else {
                console.error('LLM Analysis error:', llmErr);
            }
        }
        // Stage 4: Comprehensive & Basic Summary Generation
        sendEvent('status', {
            stage: 'summarizing',
            step: 4,
            totalSteps: 6,
            message: `Synthesizing editorial research briefing and basic language explanation in [${language}]...`,
        });
        let summaryResult = null;
        try {
            summaryResult = await (0, llm_js_1.generateSummary)(topic, extractedSources, language, llmKey, llmProvider);
            sendEvent('summary', summaryResult);
        }
        catch (sumErr) {
            if (sumErr.message.startsWith('MISSING_KEY:')) {
                sendEvent('missing_key', {
                    key: 'LLM_API_KEY',
                    message: sumErr.message,
                });
            }
            else {
                console.error('LLM Summary error:', sumErr);
            }
        }
        // Stage 5: Mindmap Generation
        sendEvent('status', {
            stage: 'mindmap',
            step: 5,
            totalSteps: 6,
            message: 'Generating interactive hierarchical knowledge mindmap...',
        });
        try {
            const mindmapResult = await (0, llm_js_1.generateMindmap)(topic, extractedSources, llmKey, llmProvider);
            sendEvent('mindmap', mindmapResult);
        }
        catch (mmErr) {
            if (mmErr.message.startsWith('MISSING_KEY:')) {
                sendEvent('missing_key', {
                    key: 'LLM_API_KEY',
                    message: mmErr.message,
                });
            }
            else {
                console.error('Mindmap error:', mmErr);
            }
        }
        // Stage 6: Illustrative Concept Image Generation
        sendEvent('status', {
            stage: 'image',
            step: 6,
            totalSteps: 6,
            message: 'Generating conceptual editorial illustration...',
        });
        try {
            const summaryExcerpt = summaryResult?.executiveSummary || topic;
            const imageResult = await (0, imageProvider_js_1.generateResearchImage)(topic, summaryExcerpt, imageKey, imageProvider);
            sendEvent('image', imageResult);
        }
        catch (imgErr) {
            if (imgErr.message.startsWith('MISSING_KEY:')) {
                sendEvent('missing_key', {
                    key: 'IMAGE_API_KEY',
                    message: imgErr.message,
                });
            }
            else {
                console.error('Image generation error:', imgErr.message);
                sendEvent('image_error', { message: imgErr.message });
            }
        }
        // Done
        sendEvent('status', {
            stage: 'complete',
            step: 6,
            totalSteps: 6,
            message: 'Deep research synthesis complete.',
        });
        sendEvent('done', {
            id: `session-${Date.now()}`,
            topic,
            completedAt: new Date().toISOString(),
        });
        res.end();
    }
    catch (error) {
        console.error('Research Stream Error:', error);
        sendEvent('error', { message: error.message || 'An unexpected pipeline error occurred.' });
        res.end();
    }
});
