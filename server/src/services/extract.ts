import axios from 'axios';
import * as cheerio from 'cheerio';
import { SearchResultItem, ExtractedSource, RelatedLink } from '../types.js';
import { extractDomain } from './searchProvider.js';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const EXCLUDED_DOMAINS = new Set([
  'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'linkedin.com',
  'youtube.com', 'pinterest.com', 'reddit.com', 'tiktok.com', 't.co',
  'bit.ly', 'goo.gl', 'apple.com', 'google.com', 'policies.google.com'
]);

export async function extractSourceContent(source: SearchResultItem): Promise<ExtractedSource> {
  const result: ExtractedSource = {
    ...source,
    fullText: '',
    wordCount: 0,
    outboundLinks: [],
  };

  try {
    const response = await axios.get(source.url, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 8000,
      maxRedirects: 5,
    });

    const html = response.data;
    if (typeof html !== 'string') {
      result.fullText = source.snippet;
      return result;
    }

    const $ = cheerio.load(html);

    // Remove noisy elements
    $('script, style, noscript, iframe, svg, nav, footer, header, form, aside, .cookie-banner, .advertisement, .ads').remove();

    // Extract title if not present
    if (!result.title || result.title === 'Untitled Source') {
      const pageTitle = $('title').text().trim() || $('h1').first().text().trim();
      if (pageTitle) result.title = pageTitle;
    }

    // Extract main text content
    const textPieces: string[] = [];
    $('article, main, [role="main"], .content, .post, .article, p, h1, h2, h3, h4').each((_, el) => {
      const text = $(el).text().replace(/\s+/g, ' ').trim();
      if (text.length > 25 && !textPieces.includes(text)) {
        textPieces.push(text);
      }
    });

    let combinedText = textPieces.join('\n\n');
    if (combinedText.length < 100) {
      combinedText = $('body').text().replace(/\s+/g, ' ').trim();
    }

    // Cap full text to ~6000 chars per source to fit context windows efficiently
    result.fullText = combinedText.slice(0, 6000) || source.snippet;
    result.wordCount = result.fullText.split(/\s+/).length;

    // Extract outbound links (secondary / adjacent URLs)
    const baseDomain = source.domain || extractDomain(source.url);
    const discoveredLinks: RelatedLink[] = [];
    const seenUrls = new Set<string>();

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href')?.trim();
      const linkText = $(el).text().replace(/\s+/g, ' ').trim();

      if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:')) {
        return;
      }

      try {
        const fullUrl = new URL(href, source.url).toString();
        const linkDomain = extractDomain(fullUrl);

        // Filter: must be HTTP/S, must be different from origin domain, must not be common social network
        if (
          (fullUrl.startsWith('http://') || fullUrl.startsWith('https://')) &&
          linkDomain !== baseDomain &&
          !EXCLUDED_DOMAINS.has(linkDomain) &&
          !seenUrls.has(fullUrl) &&
          linkText.length >= 3 &&
          linkText.length <= 100
        ) {
          seenUrls.add(fullUrl);
          discoveredLinks.push({
            title: linkText,
            url: fullUrl,
            domain: linkDomain,
            contextText: $(el).parent().text().replace(/\s+/g, ' ').slice(0, 150).trim(),
          });
        }
      } catch {
        // invalid url
      }
    });

    result.outboundLinks = discoveredLinks.slice(0, 15);
  } catch (error) {
    // If fetching the URL fails (e.g. 403, timeout), fallback to the rich search snippet
    result.fullText = source.snippet;
    result.wordCount = source.snippet.split(/\s+/).length;
    result.outboundLinks = [];
  }

  return result;
}

export async function extractMultipleSources(sources: SearchResultItem[]): Promise<{
  extractedSources: ExtractedSource[];
  relatedUrls: RelatedLink[];
}> {
  const promises = sources.map((s) => extractSourceContent(s));
  const extractedSources = await Promise.all(promises);

  // Aggregate and rank all outbound miscellaneous URLs
  const urlMap = new Map<string, { link: RelatedLink; count: number }>();

  for (const source of extractedSources) {
    for (const link of source.outboundLinks || []) {
      const existing = urlMap.get(link.url);
      if (existing) {
        existing.count += 1;
      } else {
        urlMap.set(link.url, { link, count: 1 });
      }
    }
  }

  // Sort by occurrence and domain authority heuristics
  const relatedUrls = Array.from(urlMap.values())
    .sort((a, b) => b.count - a.count)
    .map((item) => item.link)
    .slice(0, 20);

  return {
    extractedSources,
    relatedUrls,
  };
}

import pdfParse from 'pdf-parse';

export async function extractTextFromBuffer(filename: string, buffer: Buffer): Promise<string> {
  const isPdf = filename.toLowerCase().endsWith('.pdf') || buffer.slice(0, 5).toString('ascii').startsWith('%PDF');
  if (isPdf) {
    try {
      const parseFn = typeof pdfParse === 'function' ? pdfParse : (pdfParse as any).default || pdfParse;
      const data = await parseFn(buffer);
      if (data && data.text && data.text.trim()) {
        return data.text.trim();
      }
    } catch (err) {
      console.warn('pdf-parse failed, falling back to readable string extraction:', err);
    }
  }

  // Text, markdown, JSON, CSV or fallback
  const raw = buffer.toString('utf-8');
  if (isPdf && /[\x00-\x08\x0E-\x1F]/.test(raw.slice(0, 100))) {
    const matches = raw.match(/[\x20-\x7E\t\r\n]{4,}/g);
    return matches ? matches.join(' ') : raw;
  }
  return raw;
}

export function parseUploadedText(filename: string, contentBuffer: Buffer): ExtractedSource {
  const rawText = contentBuffer.toString('utf-8');
  return {
    id: `upload-${Date.now()}`,
    title: `[User Upload] ${filename}`,
    url: `file://${filename}`,
    snippet: rawText.slice(0, 300),
    fullText: rawText.slice(0, 8000),
    domain: 'user-document',
    credibilityType: 'general',
    wordCount: rawText.split(/\s+/).length,
    outboundLinks: [],
  };
}
