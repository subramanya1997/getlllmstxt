// types.ts - Type definitions for the sitemap parser

// Request type extension
export interface RequestType extends Request {
  method: string;
  headers: Headers;
}

// URL entry from a sitemap
export interface SitemapUrl {
  url: string;
  domain: string;
  sitemap_url: string;
  potential_llms_txt: string | null;
  title?: string;
  description?: string;
  user_id?: string;
  status?: string;
  created_at?: string;
  is_latest?: boolean;
}

// Metadata about a processed sitemap
export interface SitemapMetadata {
  url: string;
  domain: string;
  url_count: number;
  parsed_at: string;
  user_id?: string;
  status: string;
}

// Job record for processing a sitemap
export interface ProcessingJob {
  id: string;
  sitemap_url: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_urls?: number;
  processed_urls?: number;
}

// Extracted metadata from a web page
export interface PageMetadata {
  title: string;
  description: string;
}

// Result of processing a sitemap
export interface SitemapProcessingResult {
  urls: string[];
  isSitemapIndex: boolean;
}

// Declare Deno namespace for TypeScript
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}
