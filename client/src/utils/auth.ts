import { UserProfile, SavedDossierItem, QuizQuestion } from '../types';
import { getStoredApiKeys } from './keys';

const TOKEN_KEY = 'ai_deep_researcher_token';
const USER_KEY = 'ai_deep_researcher_user';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: UserProfile): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Error persisting auth session:', err);
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.error('Error clearing auth session:', err);
  }
}

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function login(email: string, password: string): Promise<UserProfile> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to sign in.');
  }

  setSession(data.token, data.user);
  return data.user;
}

export async function signup(payload: {
  email: string;
  password: string;
  name: string;
  gradeLevel?: 'middle' | 'high' | 'college' | 'lifelong';
  role?: 'student' | 'educator' | 'parent';
  interests?: string[];
}): Promise<UserProfile> {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed.');
  }

  setSession(data.token, data.user);
  return data.user;
}

export async function loginWithGoogle(payload: {
  credential?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  googleId?: string;
}): Promise<UserProfile> {
  const res = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Google login failed.');
  }

  setSession(data.token, data.user);
  return data.user;
}

export async function fetchCurrentUser(): Promise<UserProfile | null> {
  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      clearSession();
      return null;
    }

    const data = await res.json();
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user;
    }
    return null;
  } catch {
    return getStoredUser();
  }
}

export async function updateStudentProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const res = await fetch('/api/auth/update-profile', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not update profile.');
  }

  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function saveDossierToVault(dossier: {
  topic: string;
  summarySnippet: string;
  language?: string;
  sourceCount?: number;
}): Promise<{ item: SavedDossierItem; user: UserProfile }> {
  const res = await fetch('/api/auth/save-dossier', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(dossier),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not save dossier to vault.');
  }

  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return { item: data.item, user: data.user };
}

export async function generateStudentQuiz(
  topic: string,
  summaryContent: string,
  gradeLevel: string = 'high'
): Promise<QuizQuestion[]> {
  const { llmKey, llmProvider } = getStoredApiKeys();

  const res = await fetch('/api/auth/quiz-generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      topic,
      summaryContent,
      gradeLevel,
      customKey: llmKey || undefined,
      customProvider: llmProvider || undefined,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not generate quiz.');
  }

  return data.questions;
}

export async function recordQuizResult(
  topic: string,
  score: number,
  total: number
): Promise<UserProfile> {
  const res = await fetch('/api/auth/quiz-result', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ topic, score, total }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not record quiz.');
  }

  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data.user;
}

export async function recordFocusTime(minutes: number): Promise<void> {
  const token = getStoredToken();
  if (!token) return;

  try {
    const res = await fetch('/api/auth/record-focus', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ minutes }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }
    }
  } catch (err) {
    console.warn('Could not sync focus minutes to student profile:', err);
  }
}
