export interface StoredKeyConfig {
  searchKey?: string;
  searchProvider?: string;
  llmKey?: string;
  llmProvider?: string;
  imageKey?: string;
  imageProvider?: string;
}

export function getStoredApiKeys(): StoredKeyConfig {
  let config: StoredKeyConfig = {};

  try {
    const raw = localStorage.getItem('ai_deep_researcher_keys');
    if (raw) {
      config = JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse ai_deep_researcher_keys from localStorage');
  }

  // Fallbacks to individual keys
  const llmKey = config.llmKey || localStorage.getItem('llmApiKey') || localStorage.getItem('geminiApiKey') || localStorage.getItem('openaiApiKey') || '';
  const searchKey = config.searchKey || localStorage.getItem('searchApiKey') || localStorage.getItem('tavilyApiKey') || '';
  const imageKey = config.imageKey || localStorage.getItem('imageApiKey') || llmKey;

  let llmProvider = config.llmProvider || localStorage.getItem('llmProvider') || '';
  if (!llmProvider && llmKey) {
    if (llmKey.startsWith('AIzaSy') || llmKey.toLowerCase().startsWith('aq')) {
      llmProvider = 'gemini';
    } else if (llmKey.startsWith('sk-ant-')) {
      llmProvider = 'anthropic';
    } else if (llmKey.startsWith('sk-') || llmKey.startsWith('org-')) {
      llmProvider = 'openai';
    }
  }

  let searchProvider = config.searchProvider;
  if (!searchProvider) {
    searchProvider = searchKey ? 'tavily' : 'auto';
  }

  return {
    ...config,
    llmKey: llmKey || undefined,
    llmProvider: llmProvider || undefined,
    searchKey: searchKey || undefined,
    searchProvider,
    imageKey: imageKey || undefined,
  };
}
