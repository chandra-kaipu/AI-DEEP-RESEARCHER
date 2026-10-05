import { Router, Request, Response } from 'express';
import { analyzeTrends } from '../services/llm.js';
import { runtimeKeys } from './keys.js';
import { ExtractedSource } from '../types.js';

export const analyzeRouter = Router();

analyzeRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { topic, sources, customKey, customProvider } = req.body || {};

    if (!topic || !Array.isArray(sources) || sources.length === 0) {
      return res.status(400).json({ error: 'Missing topic or extracted sources for analysis.' });
    }

    const llmKey = customKey || runtimeKeys.llmKey;
    const llmProvider = customProvider || runtimeKeys.llmProvider;

    const analysis = await analyzeTrends(topic, sources as ExtractedSource[], llmKey, llmProvider);
    res.json(analysis);
  } catch (error: any) {
    console.error('Analyze endpoint error:', error.message);
    const isMissingKey = error.message.startsWith('MISSING_KEY:');
    res.status(isMissingKey ? 401 : 500).json({
      error: error.message,
      missingKey: isMissingKey ? error.message.split(':')[1] : null,
    });
  }
});
