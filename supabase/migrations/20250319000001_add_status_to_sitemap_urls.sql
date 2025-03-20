-- Add status column to sitemap_urls table
ALTER TABLE sitemap_urls ADD COLUMN status text DEFAULT 'pending';

-- Create index for faster filtering by status
CREATE INDEX idx_sitemap_urls_status ON sitemap_urls (status);

-- Add comment to document the status values
COMMENT ON COLUMN sitemap_urls.status IS 'Status of URL processing: pending, processing, completed, failed';
