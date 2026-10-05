"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runtimeKeys = exports.keysRouter = void 0;
const express_1 = require("express");
exports.keysRouter = (0, express_1.Router)();
// In-memory runtime override store (allows user to test keys in UI without restarting server)
exports.runtimeKeys = {};
exports.keysRouter.get('/status', (req, res) => {
    const searchKey = exports.runtimeKeys.searchKey || process.env.SEARCH_API_KEY;
    const llmKey = exports.runtimeKeys.llmKey || process.env.LLM_API_KEY;
    const imageKey = exports.runtimeKeys.imageKey || process.env.IMAGE_API_KEY;
    const ttsKey = exports.runtimeKeys.ttsKey || process.env.TTS_API_KEY;
    const activeSearchProvider = exports.runtimeKeys.searchProvider || process.env.SEARCH_PROVIDER || 'auto';
    const status = {
        searchKeySet: Boolean((searchKey && searchKey.trim().length > 0) || activeSearchProvider === 'auto'),
        searchProvider: activeSearchProvider,
        llmKeySet: Boolean(llmKey && llmKey.trim().length > 0),
        llmProvider: exports.runtimeKeys.llmProvider || process.env.LLM_PROVIDER || 'gemini',
        imageKeySet: true, // Multi-tier free generative engine active
        imageProvider: exports.runtimeKeys.imageProvider || process.env.IMAGE_PROVIDER || 'openai',
        ttsKeySet: Boolean((ttsKey && ttsKey.trim().length > 0) || (llmKey && llmKey.startsWith('sk-'))),
    };
    res.json({
        status: 'ok',
        keys: status,
        instructions: {
            search: 'Set SEARCH_API_KEY (e.g. from https://tavily.com)',
            llm: 'Set LLM_API_KEY (Anthropic sk-ant-... or OpenAI sk-...)',
            image: 'Set IMAGE_API_KEY or use OpenAI key',
        }
    });
});
exports.keysRouter.get('/test-gemini', async (req, res) => {
    const apiKey = req.query.key || exports.runtimeKeys.llmKey || process.env.LLM_API_KEY;
    if (!apiKey)
        return res.status(400).json({ error: 'No apiKey found' });
    try {
        const listRes = await (await import('axios')).default.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const models = (listRes.data?.models || []).map((m) => ({
            name: m.name,
            displayName: m.displayName,
            supportedGenerationMethods: m.supportedGenerationMethods,
        }));
        res.json({
            keyPrefix: apiKey.slice(0, 8) + '...',
            count: models.length,
            models,
        });
    }
    catch (err) {
        res.status(err.response?.status || 500).json({
            error: err.message,
            status: err.response?.status,
            data: err.response?.data,
            keyPrefix: apiKey.slice(0, 8) + '...',
        });
    }
});
exports.keysRouter.post('/config', (req, res) => {
    const { searchKey, searchProvider, llmKey, llmProvider, imageKey, imageProvider, ttsKey } = req.body || {};
    if (searchKey !== undefined) {
        exports.runtimeKeys.searchKey = searchKey.trim();
        if (exports.runtimeKeys.searchKey)
            process.env.SEARCH_API_KEY = exports.runtimeKeys.searchKey;
    }
    if (searchProvider !== undefined) {
        exports.runtimeKeys.searchProvider = searchProvider;
        if (exports.runtimeKeys.searchProvider)
            process.env.SEARCH_PROVIDER = exports.runtimeKeys.searchProvider;
    }
    if (llmKey !== undefined) {
        exports.runtimeKeys.llmKey = llmKey.trim();
        if (exports.runtimeKeys.llmKey)
            process.env.LLM_API_KEY = exports.runtimeKeys.llmKey;
    }
    if (llmProvider !== undefined) {
        exports.runtimeKeys.llmProvider = llmProvider;
        if (exports.runtimeKeys.llmProvider)
            process.env.LLM_PROVIDER = exports.runtimeKeys.llmProvider;
    }
    if (imageKey !== undefined) {
        exports.runtimeKeys.imageKey = imageKey.trim();
        if (exports.runtimeKeys.imageKey)
            process.env.IMAGE_API_KEY = exports.runtimeKeys.imageKey;
    }
    if (imageProvider !== undefined) {
        exports.runtimeKeys.imageProvider = imageProvider;
        if (exports.runtimeKeys.imageProvider)
            process.env.IMAGE_PROVIDER = exports.runtimeKeys.imageProvider;
    }
    if (ttsKey !== undefined) {
        exports.runtimeKeys.ttsKey = ttsKey.trim();
        if (exports.runtimeKeys.ttsKey)
            process.env.TTS_API_KEY = exports.runtimeKeys.ttsKey;
    }
    res.json({
        message: 'Runtime keys updated successfully',
        runtimeKeysSet: {
            search: Boolean(exports.runtimeKeys.searchKey),
            llm: Boolean(exports.runtimeKeys.llmKey),
            image: Boolean(exports.runtimeKeys.imageKey),
        }
    });
});
