-- Create the sitemaps table
CREATE TABLE IF NOT EXISTS public.sitemaps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL UNIQUE,
  domain TEXT NOT NULL,
  url_count INTEGER NOT NULL,
  parsed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the sitemap_urls table
CREATE TABLE IF NOT EXISTS public.sitemap_urls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  sitemap_url TEXT NOT NULL REFERENCES public.sitemaps(url) ON DELETE CASCADE,
  potential_llms_txt TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (url, sitemap_url)
);

-- Create indexes for faster lookup
CREATE INDEX IF NOT EXISTS idx_sitemaps_domain ON public.sitemaps(domain);
CREATE INDEX IF NOT EXISTS idx_sitemap_urls_domain ON public.sitemap_urls(domain);
CREATE INDEX IF NOT EXISTS idx_sitemap_urls_sitemap_url ON public.sitemap_urls(sitemap_url);

-- Set up RLS policies
ALTER TABLE public.sitemaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sitemap_urls ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.sitemaps
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for authenticated users" ON public.sitemap_urls
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_sitemaps_updated_at
BEFORE UPDATE ON public.sitemaps
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_sitemap_urls_updated_at
BEFORE UPDATE ON public.sitemap_urls
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column(); 