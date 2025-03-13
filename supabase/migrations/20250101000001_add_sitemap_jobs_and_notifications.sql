-- Add new columns to sitemaps table
ALTER TABLE IF EXISTS public.sitemaps
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add new columns to sitemap_urls table
ALTER TABLE IF EXISTS public.sitemap_urls
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Create the sitemap_jobs table for async processing
CREATE TABLE IF NOT EXISTS public.sitemap_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sitemap_url TEXT NOT NULL REFERENCES public.sitemaps(url) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'queued',
  total_urls INTEGER,
  processed_urls INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS policies for new tables
ALTER TABLE public.sitemap_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON public.sitemap_jobs
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to view their own notifications" ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Allow users to update their own notifications" ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_sitemap_jobs_updated_at
BEFORE UPDATE ON public.sitemap_jobs
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE PROCEDURE public.update_updated_at_column();

-- Create indexes for faster lookup
CREATE INDEX IF NOT EXISTS idx_sitemap_jobs_user_id ON public.sitemap_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_sitemap_jobs_status ON public.sitemap_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sitemap_jobs_sitemap_url ON public.sitemap_jobs(sitemap_url);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read); 