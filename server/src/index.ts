import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Load .env from server dir or root dir
dotenv.config();
if (fs.existsSync(path.resolve(process.cwd(), '../.env'))) {
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
}

import { keysRouter } from './routes/keys.js';
import { searchRouter } from './routes/search.js';
import { analyzeRouter } from './routes/analyze.js';
import { summarizeRouter } from './routes/summarize.js';
import { mindmapRouter } from './routes/mindmap.js';
import { imageRouter } from './routes/image.js';
import { chatRouter } from './routes/chat.js';
import { ttsRouter } from './routes/tts.js';
import { researchStreamRouter } from './routes/research-stream.js';
import { toolsRouter } from './routes/tools.js';
import { authRouter } from './routes/auth.js';
import { syllabusRouter } from './routes/syllabus.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Deep Researcher Backend',
  });
});

// Mount Routes
app.use('/api/keys', keysRouter);
app.use('/api/search', searchRouter);
app.use('/api/analyze', analyzeRouter);
app.use('/api/summarize', summarizeRouter);
app.use('/api/mindmap', mindmapRouter);
app.use('/api/image', imageRouter);
app.use('/api/chat', chatRouter);
app.use('/api/tts', ttsRouter);
app.use('/api/research/stream', researchStreamRouter);
app.use('/api/tools', toolsRouter);
app.use('/api/auth', authRouter);
app.use('/api/syllabus', syllabusRouter);

// Serve Static Frontend if built (e.g. for Replit or Production)
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
const localClientDistPath = path.resolve(process.cwd(), 'client/dist');

const staticDir = fs.existsSync(clientDistPath)
  ? clientDistPath
  : fs.existsSync(localClientDistPath)
  ? localClientDistPath
  : null;

if (staticDir) {
  console.log(`Serving static client files from: ${staticDir}`);
  app.use(express.static(staticDir));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 AI Deep Researcher server listening on port ${PORT}`);
  console.log(`📡 SSE Stream available at: http://localhost:${PORT}/api/research/stream`);
});
