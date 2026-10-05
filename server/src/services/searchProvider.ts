import axios from 'axios';
import * as cheerio from 'cheerio';
import { SearchResultItem } from '../types.js';
import { runtimeKeys } from '../routes/keys.js';

export function getCredibilityType(url: string): SearchResultItem['credibilityType'] {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.endsWith('.gov') || host.endsWith('.mil')) return 'gov';
    if (host.endsWith('.edu') || host.includes('arxiv.org') || host.includes('nature.com') || host.includes('ieee.org') || host.includes('sciencedirect.com') || host.includes('springer.com') || host.includes('nih.gov')) return 'academic';
    if (host.includes('reuters.com') || host.includes('bloomberg.com') || host.includes('nytimes.com') || host.includes('wsj.com') || host.includes('bbc.') || host.includes('theguardian.com') || host.includes('ft.com') || host.includes('apnews.com') || host.includes('forbes.com')) return 'news';
    if (host.includes('github.com') || host.includes('techcrunch.com') || host.includes('theverge.com') || host.includes('wired.com') || host.includes('arstechnica.com') || host.includes('zdnet.com')) return 'tech';
    if (host.includes('medium.com') || host.includes('substack.com') || host.includes('wordpress.com') || host.includes('blog.')) return 'blog';
    return 'general';
  } catch {
    return 'general';
  }
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export async function searchWithAutonomousLiveWeb(query: string, maxResults: number = 8): Promise<SearchResultItem[]> {
  const results: SearchResultItem[] = [];
  const seenUrls = new Set<string>();

  // 1. Query Google News RSS for live 2026 journalistic & industry reporting
  try {
    const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
    const res = await axios.get(rssUrl, { timeout: 8000 });
    const c = cheerio.load(res.data, { xmlMode: true });

    c('item').each((_, node) => {
      if (results.length >= maxResults) return;
      const title = c(node).find('title').text().trim();
      const link = c(node).find('link').text().trim();
      const pubDate = c(node).find('pubDate').text().trim();
      const source = c(node).find('source').text().trim();
      const desc = c(node).find('description').text().replace(/<[^>]+>/g, '').trim();

      if (link && !seenUrls.has(link)) {
        seenUrls.add(link);
        const domain = source || extractDomain(link);
        results.push({
          id: `source-live-${results.length + 1}-${Date.now()}`,
          title: title || 'Live Industry Analysis',
          url: link,
          snippet: desc || `Live reporting and intelligence on ${query} published by ${source || 'verified news media'}.`,
          publishedDate: pubDate ? new Date(pubDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          domain,
          credibilityType: getCredibilityType(domain || link),
        });
      }
    });
  } catch (err: any) {
    console.warn('[SearchProvider] Google News RSS query notice:', err.message);
  }

  // 2. Query Wikipedia API for deep foundational taxonomy & architectural context
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
    const wikiRes = await axios.get(wikiUrl, {
      headers: { 'User-Agent': 'AIDeepResearcher/1.0 (academic research client)' },
      timeout: 6000,
    });
    const wikiItems = wikiRes.data?.query?.search || [];
    for (const item of wikiItems.slice(0, 3)) {
      if (results.length >= maxResults) break;
      const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, '_'))}`;
      if (!seenUrls.has(pageUrl)) {
        seenUrls.add(pageUrl);
        results.push({
          id: `source-wiki-${results.length + 1}-${Date.now()}`,
          title: `${item.title} - Wikipedia`,
          url: pageUrl,
          snippet: item.snippet?.replace(/<[^>]+>/g, '').trim() || `Authoritative encyclopedic coverage on ${item.title}.`,
          domain: 'en.wikipedia.org',
          credibilityType: 'academic',
        });
      }
    }
  } catch (err: any) {
    console.warn('[SearchProvider] Wikipedia search notice:', err.message);
  }

  return results.slice(0, maxResults);
}

export async function performWebSearch(
  query: string,
  depth: 'quick' | 'deep' = 'quick',
  customKey?: string,
  customProvider?: string
): Promise<SearchResultItem[]> {
  const provider = (customProvider || runtimeKeys.searchProvider || process.env.SEARCH_PROVIDER || 'auto').toLowerCase();
  const apiKey = customKey || runtimeKeys.searchKey || process.env.SEARCH_API_KEY;
  const maxResults = depth === 'deep' ? 12 : 6;

  // 1. Explicit Autonomous Live Web search OR missing search key
  if (provider === 'auto' || provider === 'web' || provider === 'free' || !apiKey) {
    console.log(`[SearchProvider] Executing Autonomous Live Web Search for "${query}" (${maxResults} sources)...`);
    return await searchWithAutonomousLiveWeb(query, maxResults);
  }

  // 2. Tavily with seamless fallback on auth/quota failure
  if (provider === 'tavily') {
    try {
      return await searchWithTavily(query, apiKey, maxResults);
    } catch (tavErr: any) {
      console.warn(`[SearchProvider] Tavily search failed (${tavErr.message}). Seamlessly rolling over to Autonomous Live Web Search...`);
      return await searchWithAutonomousLiveWeb(query, maxResults);
    }
  }

  // 3. SerpAPI with fallback
  if (provider === 'serpapi') {
    try {
      return await searchWithSerpApi(query, apiKey, maxResults);
    } catch (serpErr: any) {
      console.warn(`[SearchProvider] SerpAPI search failed (${serpErr.message}). Seamlessly rolling over to Autonomous Live Web Search...`);
      return await searchWithAutonomousLiveWeb(query, maxResults);
    }
  }

  // 4. Bing with fallback
  if (provider === 'bing') {
    try {
      return await searchWithBing(query, apiKey, maxResults);
    } catch (bingErr: any) {
      console.warn(`[SearchProvider] Bing search failed (${bingErr.message}). Seamlessly rolling over to Autonomous Live Web Search...`);
      return await searchWithAutonomousLiveWeb(query, maxResults);
    }
  }

  // Default fallback
  return await searchWithAutonomousLiveWeb(query, maxResults);
}

async function searchWithTavily(query: string, apiKey: string, maxResults: number): Promise<SearchResultItem[]> {
  try {
    const response = await axios.post(
      'https://api.tavily.com/search',
      {
        api_key: apiKey,
        query,
        search_depth: maxResults > 6 ? 'advanced' : 'basic',
        include_answer: false,
        include_raw_content: false,
        max_results: maxResults,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        timeout: 15000,
      }
    );

    const results = response.data?.results || [];
    return results.map((item: any, idx: number) => {
      const url = item.url;
      return {
        id: `source-${idx + 1}-${Date.now()}`,
        title: item.title || 'Untitled Source',
        url,
        snippet: item.content || item.snippet || '',
        score: item.score,
        publishedDate: item.published_date,
        domain: extractDomain(url),
        credibilityType: getCredibilityType(url),
      };
    });
  } catch (err: any) {
    if (err.response?.status === 401) {
      throw new Error(
        'AUTH_ERROR:SEARCH_API_KEY: The search API key was rejected by Tavily (401 Unauthorized). Please verify your key from https://app.tavily.com.'
      );
    }
    if (err.response?.data?.detail) {
      throw new Error(`Tavily Search Error: ${err.response.data.detail}`);
    }
    throw err;
  }
}

async function searchWithSerpApi(query: string, apiKey: string, maxResults: number): Promise<SearchResultItem[]> {
  const response = await axios.get('https://serpapi.com/search', {
    params: {
      q: query,
      api_key: apiKey,
      num: maxResults,
      engine: 'google',
    },
    timeout: 15000,
  });

  const organic = response.data?.organic_results || [];
  return organic.slice(0, maxResults).map((item: any, idx: number) => {
    const url = item.link;
    return {
      id: `source-${idx + 1}-${Date.now()}`,
      title: item.title || 'Untitled Source',
      url,
      snippet: item.snippet || '',
      publishedDate: item.date,
      domain: extractDomain(url),
      credibilityType: getCredibilityType(url),
    };
  });
}

async function searchWithBing(query: string, apiKey: string, maxResults: number): Promise<SearchResultItem[]> {
  const response = await axios.get('https://api.bing.microsoft.com/v7.0/search', {
    params: {
      q: query,
      count: maxResults,
      responseFilter: 'Webpages',
    },
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
    },
    timeout: 15000,
  });

  const webPages = response.data?.webPages?.value || [];
  return webPages.map((item: any, idx: number) => {
    const url = item.url;
    return {
      id: `source-${idx + 1}-${Date.now()}`,
      title: item.name || 'Untitled Source',
      url,
      snippet: item.snippet || '',
      publishedDate: item.dateLastCrawled,
      domain: extractDomain(url),
      credibilityType: getCredibilityType(url),
    };
  });
}
