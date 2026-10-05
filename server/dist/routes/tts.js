"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ttsRouter = void 0;
const express_1 = require("express");
const ttsProvider_js_1 = require("../services/ttsProvider.js");
const keys_js_1 = require("./keys.js");
exports.ttsRouter = (0, express_1.Router)();
exports.ttsRouter.post('/', async (req, res) => {
    try {
        const { text, customKey } = req.body || {};
        if (!text) {
            return res.status(400).json({ error: 'Missing text to synthesize.' });
        }
        const ttsKey = customKey || keys_js_1.runtimeKeys.ttsKey || keys_js_1.runtimeKeys.llmKey;
        const audioBuffer = await (0, ttsProvider_js_1.generateSpeechAudio)(text, ttsKey);
        res.set({
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.length,
            'Accept-Ranges': 'bytes',
        });
        res.send(audioBuffer);
    }
    catch (error) {
        console.error('TTS endpoint error:', error.message);
        const isMissingKey = error.message.startsWith('MISSING_KEY:');
        res.status(isMissingKey ? 401 : 500).json({
            error: error.message,
            missingKey: isMissingKey ? error.message.split(':')[1] : null,
        });
    }
});
