import { Router, Request, Response } from 'express';
import { groundedChat } from '../services/llm.js';
import { runtimeKeys } from './keys.js';
import { ExtractedSource, ChatMessage } from '../types.js';

export const chatRouter = Router();

chatRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { topic, sources, messages, customKey, customProvider } = req.body || {};

    if (!topic || !Array.isArray(sources) || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing topic, sources, or message history.' });
    }

    const llmKey = customKey || runtimeKeys.llmKey;
    const llmProvider = customProvider || runtimeKeys.llmProvider;

    const result = await groundedChat(topic, sources as ExtractedSource[], messages as ChatMessage[], llmKey, llmProvider);
    res.json(result);
  } catch (error: any) {
    console.error('Chat endpoint error:', error.message);
    const isMissingKey = error.message.startsWith('MISSING_KEY:');
    res.status(isMissingKey ? 401 : 500).json({
      error: error.message,
      missingKey: isMissingKey ? error.message.split(':')[1] : null,
    });
  }
});
