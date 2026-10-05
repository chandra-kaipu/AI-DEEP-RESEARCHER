"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeRouter = void 0;
const express_1 = require("express");
const llm_js_1 = require("../services/llm.js");
const keys_js_1 = require("./keys.js");
exports.analyzeRouter = (0, express_1.Router)();
exports.analyzeRouter.post('/', async (req, res) => {
    try {
        const { topic, sources, customKey, customProvider } = req.body || {};
        if (!topic || !Array.isArray(sources) || sources.length === 0) {
            return res.status(400).json({ error: 'Missing topic or extracted sources for analysis.' });
        }
        const llmKey = customKey || keys_js_1.runtimeKeys.llmKey;
        const llmProvider = customProvider || keys_js_1.runtimeKeys.llmProvider;
        const analysis = await (0, llm_js_1.analyzeTrends)(topic, sources, llmKey, llmProvider);
        res.json(analysis);
    }
    catch (error) {
        console.error('Analyze endpoint error:', error.message);
        const isMissingKey = error.message.startsWith('MISSING_KEY:');
        res.status(isMissingKey ? 401 : 500).json({
            error: error.message,
            missingKey: isMissingKey ? error.message.split(':')[1] : null,
        });
    }
});
