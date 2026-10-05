"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageRouter = void 0;
const express_1 = require("express");
const imageProvider_js_1 = require("../services/imageProvider.js");
const keys_js_1 = require("./keys.js");
exports.imageRouter = (0, express_1.Router)();
exports.imageRouter.post('/', async (req, res) => {
    try {
        const { topic, summaryExcerpt = '', customKey, customProvider } = req.body || {};
        if (!topic) {
            return res.status(400).json({ error: 'Missing topic for image generation.' });
        }
        const imageKey = customKey || keys_js_1.runtimeKeys.imageKey;
        const imageProvider = customProvider || keys_js_1.runtimeKeys.imageProvider;
        const imageResult = await (0, imageProvider_js_1.generateResearchImage)(topic, summaryExcerpt, imageKey, imageProvider);
        res.json(imageResult);
    }
    catch (error) {
        console.error('Image endpoint error:', error.message);
        const isMissingKey = error.message.startsWith('MISSING_KEY:');
        res.status(isMissingKey ? 401 : 500).json({
            error: error.message,
            missingKey: isMissingKey ? error.message.split(':')[1] : null,
        });
    }
});
