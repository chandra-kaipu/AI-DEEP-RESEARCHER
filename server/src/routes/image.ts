import { Router, Request, Response } from 'express';
import { generateResearchImage } from '../services/imageProvider.js';
import { runtimeKeys } from './keys.js';

export const imageRouter = Router();

imageRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { topic, summaryExcerpt = '', customKey, customProvider } = req.body || {};

    if (!topic) {
      return res.status(400).json({ error: 'Missing topic for image generation.' });
    }

    const imageKey = customKey || runtimeKeys.imageKey;
    const imageProvider = customProvider || runtimeKeys.imageProvider;

    const imageResult = await generateResearchImage(topic, summaryExcerpt, imageKey, imageProvider);
    res.json(imageResult);
  } catch (error: any) {
    console.error('Image endpoint error:', error.message);
    const isMissingKey = error.message.startsWith('MISSING_KEY:');
    res.status(isMissingKey ? 401 : 500).json({
      error: error.message,
      missingKey: isMissingKey ? error.message.split(':')[1] : null,
    });
  }
});
