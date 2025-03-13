// Define interfaces for our data types
export interface SitemapJob {
  id: string;
  sitemap_url: string;
  status: string;
  total_urls: number;
  processed_urls: number;
  created_at: string;
  updated_at: string;
}

export interface Sitemap {
  id: string;
  url: string;
  domain: string;
  url_count: number;
  parsed_at: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type StorageStatus = "none" | "partial" | "full"; 