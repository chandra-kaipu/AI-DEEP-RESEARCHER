import { Router, Request, Response } from 'express';
import multer from 'multer';
import { performWebSearch } from '../services/searchProvider.js';
import { extractMultipleSources, parseUploadedText } from '../services/extract.js';
import { runtimeKeys } from './keys.js';
import { ExtractedSource, SearchResultItem } from '../types.js';

export const searchRouter = Router();
const upload = multer({ limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB limit

searchRouter.post('/', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const topic = req.body?.topic || '';
    const depth = (req.body?.depth || 'quick') as 'quick' | 'deep';

    if (!topic && !req.file) {
      return res.status(400).json({ error: 'Please provide a research topic or upload a file.' });
    }

    const searchKey = req.body?.searchKey || runtimeKeys.searchKey;
    const searchProvider = req.body?.searchProvider || runtimeKeys.searchProvider;

    let searchItems: SearchResultItem[] = [];
    if (topic) {
      searchItems = await performWebSearch(topic, depth, searchKey, searchProvider);
    }

    const { extractedSources, relatedUrls } = await extractMultipleSources(searchItems);

    // If user uploaded a document, fold it in as an extracted source
    if (req.file) {
      const uploadedSource: ExtractedSource = parseUploadedText(req.file.originalname, req.file.buffer);
      extractedSources.unshift(uploadedSource);
    }

    res.json({
      topic,
      depth,
      sources: extractedSources,
      relatedUrls,
      count: extractedSources.length,
    });
  } catch (error: any) {
    console.error('Search endpoint error:', error.message);
    const isMissingKey = error.message.startsWith('MISSING_KEY:');
    res.status(isMissingKey ? 401 : 500).json({
      error: error.message,
      missingKey: isMissingKey ? error.message.split(':')[1] : null,
    });
  }
});
