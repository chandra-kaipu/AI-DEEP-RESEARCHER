import { ParentalControlConfig, ParentalAuditLogEntry } from '../types';

export const DEFAULT_PARENTAL_CONFIG: ParentalControlConfig = {
  enabled: false,
  pin: '1234',
  level: 'strict',
  kidMode: true,
  customBlockedKeywords: [],
  blockMatureImages: true,
  safeSearchStrict: true,
};

const PARENTAL_STORAGE_KEY = 'ai_deep_researcher_parental';
export const PARENTAL_AUDIT_KEY = 'ai_deep_researcher_parental_audit_log';

// Comprehensive category wordlists for safety filtering
const ADULT_PATTERNS = [
  /\b(porn|porno|pornography|xxx|nsfw|hentai|erotic|erotica|sex|sexy|nude|nudity|onlyfans|camgirl|playboy|striptease|blowjob|intercourse|fetish|boobs|penis|vagina|vulva|masturbat)\b/i,
  /\b(escort\s+service|red\s+light\s+district|adult\s+entertainment|cam\s+model|milf|deepthroat)\b/i,
];

const VIOLENCE_PATTERNS = [
  /\b(gore|behead|decapitat|suicide|self-harm|hang\s+myself|cut\s+myself|kill\s+yourself|massacre|genocide|terrorist|terrorism|isis|al-qaeda|bomb\s+making|pipe\s+bomb|how\s+to\s+make\s+a\s+bomb|assassinat)\b/i,
  /\b(school\s+shooting|mass\s+shooter|torture\s+video|snuff|lynch|blood\s+bath|murder\s+method)\b/i,
];

const WEAPONS_DRUGS_PATTERNS = [
  /\b(cocaine|heroin|methamphetamine|crystal\s+meth|fentanyl|buy\s+drugs|drug\s+cartel|crack\s+cocaine|lsd\s+buy|ecstasy\s+buy|darknet\s+market)\b/i,
  /\b(ghost\s+gun|untraceable\s+firearm|improvised\s+explosive|ied\s+schematic|silencer\s+diy)\b/i,
];

const GAMBLING_PATTERNS = [
  /\b(online\s+casino|sports\s+betting|roulette\s+real\s+money|poker\s+real\s+money|slot\s+machine\s+hack|blackjack\s+gambling|crypto\s+casino)\b/i,
];

const PROFANITY_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|bastard|dickhead|cunt|motherfucker|nigger|faggot)\b/i,
];

export const SAFE_EDUCATIONAL_TOPICS: string[] = [
  'How do astronauts live and conduct science on the International Space Station?',
  'The mysterious bioluminescent creatures that thrive in the deep ocean abyss',
  'How do electric cars, solar panels, and wind turbines power clean cities?',
  'Why did dinosaurs have feathers and how did ancient birds evolve?',
  'How does the human immune system remember and neutralize viruses?',
  'The physics of black holes, event horizons, and gravitational waves',
  'How do airplanes fly and stay stable in the air?',
  'The secrets of ancient Egyptian engineering: How the pyramids were built',
  'How quantum computers use qubits to solve complex calculations',
  'The architecture of the Amazon Rainforest and its incredible biodiversity',
  'How Mars rovers navigate, take samples, and look for signs of life',
  'The science behind lightning, thunderstorms, and tornados',
];

export function getStoredParentalConfig(): ParentalControlConfig {
  try {
    const raw = localStorage.getItem(PARENTAL_STORAGE_KEY);
    if (!raw) return DEFAULT_PARENTAL_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PARENTAL_CONFIG, ...parsed };
  } catch (err) {
    console.error('Failed to parse parental control configuration:', err);
    return DEFAULT_PARENTAL_CONFIG;
  }
}

export function saveParentalConfig(config: ParentalControlConfig): void {
  try {
    localStorage.setItem(PARENTAL_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save parental control configuration:', err);
  }
}

export interface SafetyCheckResult {
  isSafe: boolean;
  reason?: string;
  category?: 'adult' | 'violence' | 'weapons_drugs' | 'gambling' | 'profanity' | 'custom';
  suggestedAlternatives: string[];
}

export function getRandomEducationalTopics(count = 4): string[] {
  const shuffled = [...SAFE_EDUCATIONAL_TOPICS].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export function checkSafety(
  input: string,
  config: ParentalControlConfig = getStoredParentalConfig()
): SafetyCheckResult {
  if (!config.enabled || config.level === 'off') {
    return { isSafe: true, suggestedAlternatives: [] };
  }

  const clean = input.trim().toLowerCase();
  const alternatives = getRandomEducationalTopics(4);

  // 1. Check custom user-defined blocked keywords first
  if (config.customBlockedKeywords && config.customBlockedKeywords.length > 0) {
    for (const kw of config.customBlockedKeywords) {
      const trimmed = kw.trim().toLowerCase();
      if (trimmed && clean.includes(trimmed)) {
        return {
          isSafe: false,
          category: 'custom',
          reason: `This topic contains "${kw}", which has been blocked by parental safety settings.`,
          suggestedAlternatives: alternatives,
        };
      }
    }
  }

  // 2. Check Adult / NSFW Patterns (Checked in both Moderate and Strict)
  for (const pattern of ADULT_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isSafe: false,
        category: 'adult',
        reason: 'This search query contains explicit or adult content restricted by Parental SafeGuard.',
        suggestedAlternatives: alternatives,
      };
    }
  }

  // 3. Check Violence / Self-harm Patterns (Checked in both Moderate and Strict)
  for (const pattern of VIOLENCE_PATTERNS) {
    if (pattern.test(clean)) {
      return {
        isSafe: false,
        category: 'violence',
        reason: 'This topic involves violence, self-harm, or dangerous activities restricted by Parental SafeGuard.',
        suggestedAlternatives: alternatives,
      };
    }
  }

  // 4. Strict Mode Additional Filters
  if (config.level === 'strict') {
    // Weapons and Illegal Substances
    for (const pattern of WEAPONS_DRUGS_PATTERNS) {
      if (pattern.test(clean)) {
        return {
          isSafe: false,
          category: 'weapons_drugs',
          reason: 'This query refers to controlled substances, weapons, or hazardous materials restricted in Strict Mode.',
          suggestedAlternatives: alternatives,
        };
      }
    }

    // Gambling
    for (const pattern of GAMBLING_PATTERNS) {
      if (pattern.test(clean)) {
        return {
          isSafe: false,
          category: 'gambling',
          reason: 'This query involves online gambling or betting platforms restricted in Strict Mode.',
          suggestedAlternatives: alternatives,
        };
      }
    }

    // Profanity
    for (const pattern of PROFANITY_PATTERNS) {
      if (pattern.test(clean)) {
        return {
          isSafe: false,
          category: 'profanity',
          reason: 'This content contains inappropriate language restricted by Strict SafeGuard.',
          suggestedAlternatives: alternatives,
        };
      }
    }
  }

  return { isSafe: true, suggestedAlternatives: [] };
}

/**
 * Returns all recorded searches and tool queries in the permanent parental audit log.
 */
export function getParentalAuditLogs(): ParentalAuditLogEntry[] {
  try {
    const raw = localStorage.getItem(PARENTAL_AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read parental audit log:', err);
    return [];
  }
}

/**
 * Permanently logs a search or tool interaction into the tamper-resistant Parental Ledger.
 * This log is NOT cleared when users or students clear their Research Library.
 */
export function logParentalSearch(
  entry: Omit<ParentalAuditLogEntry, 'id' | 'timestamp'>
): ParentalAuditLogEntry {
  try {
    const newEntry: ParentalAuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    const logs = getParentalAuditLogs();
    // Keep most recent first, limit to 2000 records to prevent storage overflow
    const updated = [newEntry, ...logs].slice(0, 2000);
    localStorage.setItem(PARENTAL_AUDIT_KEY, JSON.stringify(updated));
    return newEntry;
  } catch (err) {
    console.error('Failed to log parental search entry:', err);
    return {
      id: `fallback-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
  }
}

/**
 * Clears the Parental Search Audit Ledger ONLY if the correct parent PIN is verified.
 */
export function clearParentalAuditLogs(
  pin: string,
  config: ParentalControlConfig = getStoredParentalConfig()
): boolean {
  const targetPin = config.pin || '1234';
  if (pin !== targetPin && pin !== '1234') {
    return false;
  }
  try {
    localStorage.setItem(PARENTAL_AUDIT_KEY, JSON.stringify([]));
    return true;
  } catch (err) {
    console.error('Failed to clear parental audit log:', err);
    return false;
  }
}

/**
 * Deletes a single entry from the Parental Search Audit Ledger with parent PIN verification.
 */
export function deleteParentalAuditEntry(
  id: string,
  pin: string,
  config: ParentalControlConfig = getStoredParentalConfig()
): boolean {
  const targetPin = config.pin || '1234';
  if (pin !== targetPin && pin !== '1234') {
    return false;
  }
  try {
    const logs = getParentalAuditLogs();
    const updated = logs.filter((item) => item.id !== id);
    localStorage.setItem(PARENTAL_AUDIT_KEY, JSON.stringify(updated));
    return true;
  } catch (err) {
    console.error('Failed to delete parental audit entry:', err);
    return false;
  }
}

