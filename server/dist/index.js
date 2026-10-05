"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load .env from server dir or root dir
dotenv_1.default.config();
if (fs_1.default.existsSync(path_1.default.resolve(process.cwd(), '../.env'))) {
    dotenv_1.default.config({ path: path_1.default.resolve(process.cwd(), '../.env') });
}
const keys_js_1 = require("./routes/keys.js");
const search_js_1 = require("./routes/search.js");
const analyze_js_1 = require("./routes/analyze.js");
const summarize_js_1 = require("./routes/summarize.js");
const mindmap_js_1 = require("./routes/mindmap.js");
const image_js_1 = require("./routes/image.js");
const chat_js_1 = require("./routes/chat.js");
const tts_js_1 = require("./routes/tts.js");
const research_stream_js_1 = require("./routes/research-stream.js");
const tools_js_1 = require("./routes/tools.js");
const auth_js_1 = require("./routes/auth.js");
const syllabus_js_1 = require("./routes/syllabus.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middlewares
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json({ limit: '20mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '20mb' }));
// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'AI Deep Researcher Backend',
    });
});
// Mount Routes
app.use('/api/keys', keys_js_1.keysRouter);
app.use('/api/search', search_js_1.searchRouter);
app.use('/api/analyze', analyze_js_1.analyzeRouter);
app.use('/api/summarize', summarize_js_1.summarizeRouter);
app.use('/api/mindmap', mindmap_js_1.mindmapRouter);
app.use('/api/image', image_js_1.imageRouter);
app.use('/api/chat', chat_js_1.chatRouter);
app.use('/api/tts', tts_js_1.ttsRouter);
app.use('/api/research/stream', research_stream_js_1.researchStreamRouter);
app.use('/api/tools', tools_js_1.toolsRouter);
app.use('/api/auth', auth_js_1.authRouter);
app.use('/api/syllabus', syllabus_js_1.syllabusRouter);
// Serve Static Frontend if built (e.g. for Replit or Production)
const clientDistPath = path_1.default.resolve(process.cwd(), '../client/dist');
const localClientDistPath = path_1.default.resolve(process.cwd(), 'client/dist');
const staticDir = fs_1.default.existsSync(clientDistPath)
    ? clientDistPath
    : fs_1.default.existsSync(localClientDistPath)
        ? localClientDistPath
        : null;
if (staticDir) {
    console.log(`Serving static client files from: ${staticDir}`);
    app.use(express_1.default.static(staticDir));
    app.get('*', (req, res) => {
        res.sendFile(path_1.default.join(staticDir, 'index.html'));
    });
}
app.listen(PORT, () => {
    console.log(`🚀 AI Deep Researcher server listening on port ${PORT}`);
    console.log(`📡 SSE Stream available at: http://localhost:${PORT}/api/research/stream`);
});
