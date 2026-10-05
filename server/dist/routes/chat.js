"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const llm_js_1 = require("../services/llm.js");
const keys_js_1 = require("./keys.js");
exports.chatRouter = (0, express_1.Router)();
exports.chatRouter.post('/', async (req, res) => {
    try {
        const { topic, sources, messages, customKey, customProvider } = req.body || {};
        if (!topic || !Array.isArray(sources) || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Missing topic, sources, or message history.' });
        }
        const llmKey = customKey || keys_js_1.runtimeKeys.llmKey;
        const llmProvider = customProvider || keys_js_1.runtimeKeys.llmProvider;
        const result = await (0, llm_js_1.groundedChat)(topic, sources, messages, llmKey, llmProvider);
        res.json(result);
    }
    catch (error) {
        console.error('Chat endpoint error:', error.message);
        const isMissingKey = error.message.startsWith('MISSING_KEY:');
        res.status(isMissingKey ? 401 : 500).json({
            error: error.message,
            missingKey: isMissingKey ? error.message.split(':')[1] : null,
        });
    }
});
