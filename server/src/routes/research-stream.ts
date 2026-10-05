import { Router, Request, Response } from 'express';
import { performWebSearch } from '../services/searchProvider.js';
import { extractMultipleSources } from '../services/extract.js';
import { analyzeTrends, generateSummary, generateMindmap } from '../services/llm.js';
import { generateResearchImage } from '../services/imageProvider.js';
import { runtimeKeys } from './keys.js';
import { ExtractedSource, SearchResultItem } from '../types.js';

export const researchStreamRouter = Router();

researchStreamRouter.get('/', async (req: Request, res: Response) => {
  const topic = (req.query.topic as string) || '';
  const depth = (req.query.depth as 'quick' | 'deep') || 'quick';
  const language = (req.query.lang as string) || 'en';

  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on proxies
  res.flushHeaders?.();

  const sendEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  if (!topic || topic.trim().length === 0) {
    sendEvent('error', { message: 'Topic is required.' });
    return res.end();
  }

  try {
    // Stage 1: Live Web Search
    sendEvent('status', {
      stage: 'searching',
      step: 1,
      totalSteps: 6,
      message: `Searching live web for "${topic}" (${depth} depth)...`,
    });

    const searchKey = (req.query.searchKey as string) || runtimeKeys.searchKey;
    const searchProvider = (req.query.searchProvider as string) || runtimeKeys.searchProvider;
    const llmKey = (req.query.llmKey as string) || runtimeKeys.llmKey;
    const llmProvider = (req.query.llmProvider as string) || runtimeKeys.llmProvider;
    const imageKey = (req.query.imageKey as string) || runtimeKeys.imageKey;
    const imageProvider = (req.query.imageProvider as string) || runtimeKeys.imageProvider;

    let searchItems: SearchResultItem[] = [];
    try {
      searchItems = await performWebSearch(topic, depth, searchKey, searchProvider);
    } catch (searchErr: any) {
      if (searchErr.message.startsWith('MISSING_KEY:') || searchErr.message.startsWith('AUTH_ERROR:')) {
        sendEvent('missing_key', {
          key: 'SEARCH_API_KEY',
          message: searchErr.message,
        });
        sendEvent('error', { message: searchErr.message });
        return res.end();
      }
      throw searchErr;
    }

    // Stage 2: Web Scraping & Miscellaneous URL Extraction
    sendEvent('status', {
      stage: 'extracting',
      step: 2,
      totalSteps: 6,
      message: `Extracting content from ${searchItems.length} sources & discovering adjacent links...`,
    });

    const { extractedSources, relatedUrls } = await extractMultipleSources(searchItems);
    sendEvent('sources', {
      sources: extractedSources,
      relatedUrls,
    });

    // Stage 3: Trend Analysis
    sendEvent('status', {
      stage: 'analyzing',
      step: 3,
      totalSteps: 6,
      message: 'Analyzing subtopic momentum, market sentiment, and emerging themes...',
    });

    let analysisResult = null;
    try {
      analysisResult = await analyzeTrends(topic, extractedSources, llmKey, llmProvider);
      sendEvent('analysis', analysisResult);
    } catch (llmErr: any) {
      if (llmErr.message.startsWith('MISSING_KEY:')) {
        sendEvent('missing_key', {
          key: 'LLM_API_KEY',
          message: llmErr.message,
        });
      } else {
        console.error('LLM Analysis error:', llmErr);
      }
    }

    // Stage 4: Comprehensive & Basic Summary Generation
    sendEvent('status', {
      stage: 'summarizing',
      step: 4,
      totalSteps: 6,
      message: `Synthesizing editorial research briefing and basic language explanation in [${language}]...`,
    });

    let summaryResult = null;
    try {
      summaryResult = await generateSummary(topic, extractedSources, language, llmKey, llmProvider);
      sendEvent('summary', summaryResult);
    } catch (sumErr: any) {
      if (sumErr.message.startsWith('MISSING_KEY:')) {
        sendEvent('missing_key', {
          key: 'LLM_API_KEY',
          message: sumErr.message,
        });
      } else {
        console.error('LLM Summary error:', sumErr);
      }
    }

    // Stage 5: Mindmap Generation
    sendEvent('status', {
      stage: 'mindmap',
      step: 5,
      totalSteps: 6,
      message: 'Generating interactive hierarchical knowledge mindmap...',
    });

    try {
      const mindmapResult = await generateMindmap(topic, extractedSources, llmKey, llmProvider);
      sendEvent('mindmap', mindmapResult);
    } catch (mmErr: any) {
      if (mmErr.message.startsWith('MISSING_KEY:')) {
        sendEvent('missing_key', {
          key: 'LLM_API_KEY',
          message: mmErr.message,
        });
      } else {
        console.error('Mindmap error:', mmErr);
      }
    }

    // Stage 6: Illustrative Concept Image Generation
    sendEvent('status', {
      stage: 'image',
      step: 6,
      totalSteps: 6,
      message: 'Generating conceptual editorial illustration...',
    });

    try {
      const summaryExcerpt = summaryResult?.executiveSummary || topic;
      const imageResult = await generateResearchImage(topic, summaryExcerpt, imageKey, imageProvider);
      sendEvent('image', imageResult);
    } catch (imgErr: any) {
      if (imgErr.message.startsWith('MISSING_KEY:')) {
        sendEvent('missing_key', {
          key: 'IMAGE_API_KEY',
          message: imgErr.message,
        });
      } else {
        console.error('Image generation error:', imgErr.message);
        sendEvent('image_error', { message: imgErr.message });
      }
    }

    // Done
    sendEvent('status', {
      stage: 'complete',
      step: 6,
      totalSteps: 6,
      message: 'Deep research synthesis complete.',
    });

    sendEvent('done', {
      id: `session-${Date.now()}`,
      topic,
      completedAt: new Date().toISOString(),
    });

    res.end();
  } catch (error: any) {
    console.error('Research Stream Error:', error);
    sendEvent('error', { message: error.message || 'An unexpected pipeline error occurred.' });
    res.end();
  }
});
