// Define interfaces for our data types
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
