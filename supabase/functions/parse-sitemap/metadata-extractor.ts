// metadata-extractor.ts - Functions for extracting metadata from web pages

import { PageMetadata } from "./types";

/**
 * Extracts metadata (title, description) from a web page
 * @param url URL of the page to extract metadata from
 * @returns Promise with the extracted page metadata
 */
export async function extractPageMetadata(url: string): Promise<PageMetadata> {
  try {
    console.log(`Fetching metadata for URL: ${url}`);
    
    // Set a timeout for fetch operations to prevent hanging on slow sites
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; getlllmstxt/1.0; +https://getlllmstxt.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      signal: controller.signal
    }).catch(err => {
      console.error(`Network error fetching ${url}:`, err);
      return null;
    });
    
    clearTimeout(timeoutId);
    
    if (!response || !response.ok) {
      console.log(`Failed to fetch ${url}, status: ${response?.status}`);
      return { title: '', description: '' };
    }
    
    // Stream to prevent memory issues with large pages
    const textDecoder = new TextDecoder();
    const reader = response.body?.getReader();
    
    if (!reader) {
      console.error(`Cannot get reader for ${url}`);
      return { title: '', description: '' };
    }
    
    // We'll look at just the first part of the HTML where metadata usually resides
    // This prevents us from having to download the entire page
    let html = '';
    let bytesRead = 0;
    const MAX_BYTES = 100000; // Only read the first 100KB
    
    while (bytesRead < MAX_BYTES) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      html += textDecoder.decode(value, { stream: true });
      bytesRead += value.length;
      
      // Check if we've already found what we need
      if (html.includes('</head>')) break;
    }
    
    // Close the reader
    reader.releaseLock();
    response.body?.cancel();
    
    // Extract title
    let title = '';
    
    // Pattern to match title tag with possible whitespace and attributes
    const titlePatterns = [
      /<title[^>]*>([\s\S]*?)<\/title>/i,                                   // Standard title tag
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i,  // OpenGraph title
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:title["']/i,  // OpenGraph title (alternate format)
      /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i, // Twitter title
      /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:title["']/i  // Twitter title (alternate format)
    ];
    
    // Try each pattern until we find a match
    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        title = match[1].trim();
        // Clean up HTML entities
        title = title.replace(/&amp;/g, '&')
                   .replace(/&lt;/g, '<')
                   .replace(/&gt;/g, '>')
                   .replace(/&quot;/g, '"')
                   .replace(/&#39;/g, "'");
        break;
      }
    }
    
    // Extract description
    let description = '';
    
    // Various patterns for description meta tags
    const descPatterns = [
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i,      // Standard description
      /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i,      // Standard (alt format)
      /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i, // OpenGraph description
      /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["']/i, // OpenGraph (alt format)
      /<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']*)["']/i, // Twitter description
      /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']twitter:description["']/i  // Twitter (alt format)
    ];
    
    // Try each pattern until we find a match
    for (const pattern of descPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        description = match[1].trim();
        // Clean up HTML entities
        description = description.replace(/&amp;/g, '&')
                               .replace(/&lt;/g, '<')
                               .replace(/&gt;/g, '>')
                               .replace(/&quot;/g, '"')
                               .replace(/&#39;/g, "'");
        break;
      }
    }
    
    console.log(`Extracted title: "${title}", description length: ${description.length}`);
    return { title, description };
  } catch (error) {
    console.error(`Error extracting metadata for ${url}:`, error);
    return { title: '', description: '' };
  }
}
