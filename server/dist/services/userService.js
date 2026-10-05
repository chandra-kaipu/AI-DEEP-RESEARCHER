"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
// User store path
const DATA_DIR = path_1.default.resolve(process.cwd(), 'data');
const USERS_FILE = path_1.default.join(DATA_DIR, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'ai-deep-researcher-edu-secret-key-2026';
class UserService {
    users = new Map();
    constructor() {
        this.ensureDataFile();
        this.loadUsers();
    }
    ensureDataFile() {
        if (!fs_1.default.existsSync(DATA_DIR)) {
            fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (!fs_1.default.existsSync(USERS_FILE)) {
            fs_1.default.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
        }
    }
    loadUsers() {
        try {
            const data = fs_1.default.readFileSync(USERS_FILE, 'utf8');
            const list = JSON.parse(data);
            this.users.clear();
            for (const u of list) {
                this.users.set(u.email.toLowerCase(), u);
            }
        }
        catch (err) {
            console.error('Error loading users database:', err);
            this.users.clear();
        }
    }
    persistUsers() {
        try {
            const list = Array.from(this.users.values());
            fs_1.default.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf8');
        }
        catch (err) {
            console.error('Error persisting users database:', err);
        }
    }
    hashPassword(password, salt) {
        return crypto_1.default.scryptSync(password, salt, 64).toString('hex');
    }
    generateToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
        };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const signature = crypto_1.default.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
        return `${encodedPayload}.${signature}`;
    }
    verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 2)
                return null;
            const [encodedPayload, signature] = parts;
            const expectedSignature = crypto_1.default.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
            if (signature !== expectedSignature)
                return null;
            const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
            if (payload.exp && Date.now() > payload.exp)
                return null;
            return payload;
        }
        catch {
            return null;
        }
    }
    findByEmail(email) {
        return this.users.get(email.toLowerCase().trim());
    }
    findById(id) {
        for (const u of this.users.values()) {
            if (u.id === id)
                return u;
        }
        return undefined;
    }
    sanitizeUser(user) {
        const { passwordHash, salt, ...safeUser } = user;
        return safeUser;
    }
    createUser(params) {
        const emailNorm = params.email.toLowerCase().trim();
        if (this.users.has(emailNorm)) {
            throw new Error('An account with this email address already exists. Please log in.');
        }
        const salt = crypto_1.default.randomBytes(16).toString('hex');
        const passwordHash = params.password ? this.hashPassword(params.password, salt) : undefined;
        const newUser = {
            id: `usr_${Date.now()}_${crypto_1.default.randomBytes(4).toString('hex')}`,
            email: emailNorm,
            name: params.name.trim(),
            passwordHash,
            salt,
            googleId: params.googleId,
            avatarUrl: params.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(params.name)}`,
            role: params.role || 'student',
            gradeLevel: params.gradeLevel || 'high',
            interests: params.interests || ['Science', 'History', 'Technology'],
            learningStats: {
                topicsExplored: 0,
                quizzesPassed: 0,
                totalFocusMinutes: 0,
            },
            savedDossiers: [],
            quizResults: [],
            createdAt: new Date().toISOString(),
        };
        this.users.set(emailNorm, newUser);
        this.persistUsers();
        const token = this.generateToken(newUser);
        return { user: this.sanitizeUser(newUser), token };
    }
    authenticate(email, password) {
        const emailNorm = email.toLowerCase().trim();
        const user = this.users.get(emailNorm);
        if (!user) {
            throw new Error('Invalid email or password. Please verify your credentials.');
        }
        if (!user.passwordHash || !user.salt) {
            throw new Error('This account was created via Google Sign-In. Please click "Continue with Google Mail".');
        }
        const hashedInput = this.hashPassword(password, user.salt);
        if (hashedInput !== user.passwordHash) {
            throw new Error('Invalid email or password. Please verify your credentials.');
        }
        const token = this.generateToken(user);
        return { user: this.sanitizeUser(user), token };
    }
    authenticateGoogle(googleUser) {
        const emailNorm = googleUser.email.toLowerCase().trim();
        let user = this.users.get(emailNorm);
        if (!user) {
            // First time Google sign-in: automatically create student profile
            return this.createUser({
                email: emailNorm,
                name: googleUser.name || emailNorm.split('@')[0],
                googleId: googleUser.googleId,
                avatarUrl: googleUser.avatarUrl,
                role: 'student',
                gradeLevel: 'high',
                interests: ['Science', 'History', 'Artificial Intelligence', 'Nature'],
            });
        }
        // Link Google ID and update avatar if provided
        if (googleUser.googleId && !user.googleId) {
            user.googleId = googleUser.googleId;
        }
        if (googleUser.avatarUrl && !user.avatarUrl) {
            user.avatarUrl = googleUser.avatarUrl;
        }
        this.persistUsers();
        const token = this.generateToken(user);
        return { user: this.sanitizeUser(user), token };
    }
    saveDossier(userId, dossier) {
        const user = this.findById(userId);
        if (!user)
            throw new Error('User not found');
        const item = {
            id: `dossier_${Date.now()}`,
            date: new Date().toISOString(),
            topic: dossier.topic,
            summarySnippet: dossier.summarySnippet.slice(0, 300),
            language: dossier.language || 'en',
            sourceCount: dossier.sourceCount || 0,
        };
        user.savedDossiers.unshift(item);
        user.learningStats.topicsExplored += 1;
        this.persistUsers();
        return item;
    }
    recordQuizResult(userId, result) {
        const user = this.findById(userId);
        if (!user)
            throw new Error('User not found');
        const record = {
            id: `quiz_${Date.now()}`,
            date: new Date().toISOString(),
            topic: result.topic,
            score: result.score,
            total: result.total,
        };
        user.quizResults.unshift(record);
        if (result.score >= Math.ceil(result.total * 0.6)) {
            user.learningStats.quizzesPassed += 1;
        }
        this.persistUsers();
        return record;
    }
    recordFocusTime(userId, minutes) {
        const user = this.findById(userId);
        if (!user)
            return;
        user.learningStats.totalFocusMinutes += minutes;
        this.persistUsers();
    }
    updateProfile(userId, updates) {
        const user = this.findById(userId);
        if (!user)
            throw new Error('User not found');
        if (updates.name)
            user.name = updates.name.trim();
        if (updates.gradeLevel)
            user.gradeLevel = updates.gradeLevel;
        if (updates.interests)
            user.interests = updates.interests;
        if (updates.role)
            user.role = updates.role;
        this.persistUsers();
        return this.sanitizeUser(user);
    }
}
exports.userService = new UserService();
