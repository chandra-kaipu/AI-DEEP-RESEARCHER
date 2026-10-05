"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const searchProvider_js_1 = require("../services/searchProvider.js");
const extract_js_1 = require("../services/extract.js");
const keys_js_1 = require("./keys.js");
exports.searchRouter = (0, express_1.Router)();
const upload = (0, multer_1.default)({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit
exports.searchRouter.post('/', upload.single('file'), async (req, res) => {
    try {
        const topic = req.body?.topic || '';
        const depth = (req.body?.depth || 'quick');
        if (!topic && !req.file) {
            return res.status(400).json({ error: 'Please provide a research topic or upload a file.' });
        }
        const searchKey = req.body?.searchKey || keys_js_1.runtimeKeys.searchKey;
        const searchProvider = req.body?.searchProvider || keys_js_1.runtimeKeys.searchProvider;
        let searchItems = [];
        if (topic) {
            searchItems = await (0, searchProvider_js_1.performWebSearch)(topic, depth, searchKey, searchProvider);
        }
        const { extractedSources, relatedUrls } = await (0, extract_js_1.extractMultipleSources)(searchItems);
        // If user uploaded a document, fold it in as an extracted source
        if (req.file) {
            const uploadedSource = (0, extract_js_1.parseUploadedText)(req.file.originalname, req.file.buffer);
            extractedSources.unshift(uploadedSource);
        }
        res.json({
            topic,
            depth,
            sources: extractedSources,
            relatedUrls,
            count: extractedSources.length,
        });
    }
    catch (error) {
        console.error('Search endpoint error:', error.message);
        const isMissingKey = error.message.startsWith('MISSING_KEY:');
        res.status(isMissingKey ? 401 : 500).json({
            error: error.message,
            missingKey: isMissingKey ? error.message.split(':')[1] : null,
        });
    }
});
