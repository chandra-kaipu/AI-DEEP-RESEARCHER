import { Router, Request, Response } from 'express';
import { generateSpeechAudio } from '../services/ttsProvider.js';
import { runtimeKeys } from './keys.js';

export const ttsRouter = Router();

ttsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { text, customKey } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: 'Missing text to synthesize.' });
    }

    const ttsKey = customKey || runtimeKeys.ttsKey || runtimeKeys.llmKey;
    const audioBuffer = await generateSpeechAudio(text, ttsKey);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Accept-Ranges': 'bytes',
    });
    res.send(audioBuffer);
  } catch (error: any) {
    console.error('TTS endpoint error:', error.message);
    const isMissingKey = error.message.startsWith('MISSING_KEY:');
    res.status(isMissingKey ? 401 : 500).json({
      error: error.message,
      missingKey: isMissingKey ? error.message.split(':')[1] : null,
    });
  }
});
