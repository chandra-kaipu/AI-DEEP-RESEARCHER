import { Router, Request, Response } from 'express';
import { KeyStatus } from '../types.js';

export const keysRouter = Router();

// In-memory runtime override store (allows user to test keys in UI without restarting server)
export const runtimeKeys: {
  searchKey?: string;
  searchProvider?: string;
  llmKey?: string;
  llmProvider?: string;
  imageKey?: string;
  imageProvider?: string;
  ttsKey?: string;
} = {};

keysRouter.get('/status', (req: Request, res: Response) => {
  const searchKey = runtimeKeys.searchKey || process.env.SEARCH_API_KEY;
  const llmKey = runtimeKeys.llmKey || process.env.LLM_API_KEY;
  const imageKey = runtimeKeys.imageKey || process.env.IMAGE_API_KEY;
  const ttsKey = runtimeKeys.ttsKey || process.env.TTS_API_KEY;

  const activeSearchProvider = runtimeKeys.searchProvider || process.env.SEARCH_PROVIDER || 'auto';
  const status: KeyStatus = {
    searchKeySet: Boolean((searchKey && searchKey.trim().length > 0) || activeSearchProvider === 'auto'),
    searchProvider: activeSearchProvider,
    llmKeySet: Boolean(llmKey && llmKey.trim().length > 0),
    llmProvider: runtimeKeys.llmProvider || process.env.LLM_PROVIDER || 'gemini',
    imageKeySet: true, // Multi-tier free generative engine active
    imageProvider: runtimeKeys.imageProvider || process.env.IMAGE_PROVIDER || 'openai',
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

keysRouter.get('/test-gemini', async (req: Request, res: Response) => {
  const apiKey = (req.query.key as string) || runtimeKeys.llmKey || process.env.LLM_API_KEY;
  if (!apiKey) return res.status(400).json({ error: 'No apiKey found' });
  try {
    const listRes = await (await import('axios')).default.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const models = (listRes.data?.models || []).map((m: any) => ({
      name: m.name,
      displayName: m.displayName,
      supportedGenerationMethods: m.supportedGenerationMethods,
    }));
    res.json({
      keyPrefix: apiKey.slice(0, 8) + '...',
      count: models.length,
      models,
    });
  } catch (err: any) {
    res.status(err.response?.status || 500).json({
      error: err.message,
      status: err.response?.status,
      data: err.response?.data,
      keyPrefix: apiKey.slice(0, 8) + '...',
    });
  }
});

keysRouter.post('/config', (req: Request, res: Response) => {
  const { searchKey, searchProvider, llmKey, llmProvider, imageKey, imageProvider, ttsKey } = req.body || {};

  if (searchKey !== undefined) {
    runtimeKeys.searchKey = searchKey.trim();
    if (runtimeKeys.searchKey) process.env.SEARCH_API_KEY = runtimeKeys.searchKey;
  }
  if (searchProvider !== undefined) {
    runtimeKeys.searchProvider = searchProvider;
    if (runtimeKeys.searchProvider) process.env.SEARCH_PROVIDER = runtimeKeys.searchProvider;
  }
  if (llmKey !== undefined) {
    runtimeKeys.llmKey = llmKey.trim();
    if (runtimeKeys.llmKey) process.env.LLM_API_KEY = runtimeKeys.llmKey;
  }
  if (llmProvider !== undefined) {
    runtimeKeys.llmProvider = llmProvider;
    if (runtimeKeys.llmProvider) process.env.LLM_PROVIDER = runtimeKeys.llmProvider;
  }
  if (imageKey !== undefined) {
    runtimeKeys.imageKey = imageKey.trim();
    if (runtimeKeys.imageKey) process.env.IMAGE_API_KEY = runtimeKeys.imageKey;
  }
  if (imageProvider !== undefined) {
    runtimeKeys.imageProvider = imageProvider;
    if (runtimeKeys.imageProvider) process.env.IMAGE_PROVIDER = runtimeKeys.imageProvider;
  }
  if (ttsKey !== undefined) {
    runtimeKeys.ttsKey = ttsKey.trim();
    if (runtimeKeys.ttsKey) process.env.TTS_API_KEY = runtimeKeys.ttsKey;
  }

  res.json({
    message: 'Runtime keys updated successfully',
    runtimeKeysSet: {
      search: Boolean(runtimeKeys.searchKey),
      llm: Boolean(runtimeKeys.llmKey),
      image: Boolean(runtimeKeys.imageKey),
    }
  });
});
