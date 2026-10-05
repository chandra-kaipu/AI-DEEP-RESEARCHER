import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface SavedDossierItem {
  id: string;
  topic: string;
  date: string;
  summarySnippet: string;
  language?: string;
  sourceCount?: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizRecord {
  id: string;
  topic: string;
  date: string;
  score: number;
  total: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  passwordHash?: string;
  salt?: string;
  googleId?: string;
  avatarUrl?: string;
  role: 'student' | 'educator' | 'parent';
  gradeLevel: 'middle' | 'high' | 'college' | 'lifelong';
  interests: string[];
  learningStats: {
    topicsExplored: number;
    quizzesPassed: number;
    totalFocusMinutes: number;
  };
  savedDossiers: SavedDossierItem[];
  quizResults: QuizRecord[];
  createdAt: string;
}

// User store path
const DATA_DIR = path.resolve(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'ai-deep-researcher-edu-secret-key-2026';

class UserService {
  private users: Map<string, UserProfile> = new Map();

  constructor() {
    this.ensureDataFile();
    this.loadUsers();
  }

  private ensureDataFile(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(USERS_FILE)) {
      fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
    }
  }

  private loadUsers(): void {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const list: UserProfile[] = JSON.parse(data);
      this.users.clear();
      for (const u of list) {
        this.users.set(u.email.toLowerCase(), u);
      }
    } catch (err) {
      console.error('Error loading users database:', err);
      this.users.clear();
    }
  }

  private persistUsers(): void {
    try {
      const list = Array.from(this.users.values());
      fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf8');
    } catch (err) {
      console.error('Error persisting users database:', err);
    }
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.scryptSync(password, salt, 64).toString('hex');
  }

  public generateToken(user: UserProfile): string {
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30, // 30 days
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  public verifyToken(token: string): { id: string; email: string; name: string; role: string } | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      const [encodedPayload, signature] = parts;
      const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
      if (payload.exp && Date.now() > payload.exp) return null;
      return payload;
    } catch {
      return null;
    }
  }

  public findByEmail(email: string): UserProfile | undefined {
    return this.users.get(email.toLowerCase().trim());
  }

  public findById(id: string): UserProfile | undefined {
    for (const u of this.users.values()) {
      if (u.id === id) return u;
    }
    return undefined;
  }

  public sanitizeUser(user: UserProfile): Omit<UserProfile, 'passwordHash' | 'salt'> {
    const { passwordHash, salt, ...safeUser } = user;
    return safeUser;
  }

  public createUser(params: {
    email: string;
    password?: string;
    name: string;
    role?: 'student' | 'educator' | 'parent';
    gradeLevel?: 'middle' | 'high' | 'college' | 'lifelong';
    interests?: string[];
    googleId?: string;
    avatarUrl?: string;
  }): { user: Omit<UserProfile, 'passwordHash' | 'salt'>; token: string } {
    const emailNorm = params.email.toLowerCase().trim();
    if (this.users.has(emailNorm)) {
      throw new Error('An account with this email address already exists. Please log in.');
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = params.password ? this.hashPassword(params.password, salt) : undefined;

    const newUser: UserProfile = {
      id: `usr_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
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

  public authenticate(email: string, password: string): { user: Omit<UserProfile, 'passwordHash' | 'salt'>; token: string } {
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

  public authenticateGoogle(googleUser: {
    email: string;
    name: string;
    googleId?: string;
    avatarUrl?: string;
  }): { user: Omit<UserProfile, 'passwordHash' | 'salt'>; token: string } {
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

  public saveDossier(userId: string, dossier: Omit<SavedDossierItem, 'id' | 'date'>): SavedDossierItem {
    const user = this.findById(userId);
    if (!user) throw new Error('User not found');

    const item: SavedDossierItem = {
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

  public recordQuizResult(userId: string, result: { topic: string; score: number; total: number }): QuizRecord {
    const user = this.findById(userId);
    if (!user) throw new Error('User not found');

    const record: QuizRecord = {
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

  public recordFocusTime(userId: string, minutes: number): void {
    const user = this.findById(userId);
    if (!user) return;
    user.learningStats.totalFocusMinutes += minutes;
    this.persistUsers();
  }

  public updateProfile(
    userId: string,
    updates: Partial<Pick<UserProfile, 'name' | 'gradeLevel' | 'interests' | 'role'>>
  ): Omit<UserProfile, 'passwordHash' | 'salt'> {
    const user = this.findById(userId);
    if (!user) throw new Error('User not found');

    if (updates.name) user.name = updates.name.trim();
    if (updates.gradeLevel) user.gradeLevel = updates.gradeLevel;
    if (updates.interests) user.interests = updates.interests;
    if (updates.role) user.role = updates.role;

    this.persistUsers();
    return this.sanitizeUser(user);
  }
}

export const userService = new UserService();
