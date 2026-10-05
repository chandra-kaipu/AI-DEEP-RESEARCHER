import { Router, Request, Response } from 'express';
import { generateSummary } from '../services/llm.js';
import { runtimeKeys } from './keys.js';
import { ExtractedSource } from '../types.js';

export const summarizeRouter = Router();

summarizeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { topic, sources, language = 'en', customKey, customProvider } = req.body || {};

    if (!topic || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({ error: 'Missing topic or extracted sources for summary.' });
    }

    const llmKey = customKey || runtimeKeys.llmKey;
    const llmProvider = customProvider || runtimeKeys.llmProvider;

    const summary = await generateSummary(topic, sources as ExtractedSource[], language, llmKey, llmProvider);
    res.json(summary);
  } catch (error: any) {
    console.error('Summarize endpoint error:', error.message);
    const isMissingKey = error.message.startsWith('MISSING_KEY:');
    res.status(isMissingKey ? 401 : 500).json({
      error: error.message,
      missingKey: isMissingKey ? error.message.split(':')[1] : null,
    });
  }
});
