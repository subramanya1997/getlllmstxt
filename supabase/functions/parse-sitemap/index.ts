// Follow this pattern to use Deno's native fetch API
// @ts-ignore: Deno module
// @deno-types="https://deno.land/std@0.168.0/http/server.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts" 
// @ts-ignore: Deno module
// @deno-types="https://esm.sh/v126/@supabase/supabase-js@2.23.0/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore: Local module
import { corsHeaders } from '../_shared/cors.ts';

// Import local modules
import { RequestType, SitemapUrl } from "./types";
import { processSitemapUrl } from "./sitemap-parser";
import { 
  createOrUpdateSitemap,
  createProcessingJob,
  updateJobStatus,
  updateSitemapStatus,
  batchInsertUrls
} from "./db-operations";
import { 
  processSitemapRecursively, 
  processSitemapInBackground 
} from "./sitemap-processor";
import {
  createSuccessResponse,
  createErrorResponse,
  createCorsOptionsResponse
} from "./http-utils";

/**
 * Main entrypoint for the sitemap parsing function
 * This uses a modular architecture for better maintainability
 * with functionality split across specialized modules
 */
serve(async (req: RequestType) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return createCorsOptionsResponse();
  }

  try {
    // Only accept POST requests for the actual processing
    if (req.method !== 'POST') {
      return createErrorResponse('Method not allowed. Only POST is supported for this endpoint.', 405);
    }
    
    // Parse request JSON
    const requestData = await req.json().catch(error => {
      console.error('Error parsing request JSON:', error);
      throw new Error('Invalid JSON in request body');
    });

    const {
      sitemapUrl,
      userId,
      domain,
      recursive = true,
      depth = 0,
      maxDepth = 5
    } = requestData;
    
    // Validate required parameters
    if (!sitemapUrl || !userId || !domain) {
      return createErrorResponse('Missing required parameters: sitemapUrl, userId, and domain are required.', 400);
    }
    
    console.log(`Starting sitemap processing for: ${sitemapUrl}`);
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );
    
    // First create or update the sitemap record
    console.log(`Creating/updating sitemap record for: ${sitemapUrl}`);
    const sitemapCreated = await createOrUpdateSitemap(
      supabase,
      sitemapUrl,
      domain,
      0, // Initial urlCount, will be updated during processing
      userId
    );
    
    if (!sitemapCreated) {
      console.error('Error creating sitemap record');
      return createErrorResponse(`Failed to create sitemap record`, 500);
    }
    
    // Then create a processing job to track progress (after sitemap exists in the database)
    console.log(`Sitemap record created, now creating processing job`);
    const jobId = await createProcessingJob(
      supabase,
      sitemapUrl,
      userId,
      0 // Initial totalUrls count, will be updated later
    );
    
    if (jobId === null) {
      console.error('Error creating processing job');
      return createErrorResponse(`Failed to create processing job`, 500);
    }
    
    // Process the sitemap without detaching so we can report the initial URL count
    try {
      console.log(`Starting processing of sitemap: ${sitemapUrl}`);
      
      // Use a Set to track processed sitemaps and avoid duplicates
      const processedSitemaps = new Set<string>();
      
      // Extract all URLs recursively from the sitemap
      console.log(`Extracting URLs from sitemap: ${sitemapUrl}`);
      const allUrls = await processSitemapRecursively(
        sitemapUrl,
        domain,
        processedSitemaps,
        depth
      );
      
      console.log(`Found ${allUrls.length} URLs in sitemap and nested sitemaps`);
      
      // Update the sitemap count immediately so we can report it
      await supabase
        .from('sitemaps')
        .update({ url_count: allUrls.length })
        .eq('url', sitemapUrl);
      
      // Start the actual processing in the background
      // This is still asynchronous but we've already extracted the URLs
      (async () => {
        try {
          await processSitemapInBackground(
            sitemapUrl,
            allUrls,
            domain,
            jobId,
            userId,
            supabase
          );
        } catch (error) {
          console.error(`Error in background processing of ${sitemapUrl}:`, error);
          
          // Update job and sitemap status on error
          await updateJobStatus(supabase, jobId, 'failed', 0);
          await updateSitemapStatus(supabase, sitemapUrl, 'failed');
        }
      })();
      
      // Return success response with the initial URL count
      return createSuccessResponse({
        message: 'Sitemap processing started successfully',
        jobId,
        status: 'processing',
        urlCount: allUrls.length // Add the count to the response
      });
    } catch (error) {
      console.error('Error during initial sitemap processing:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(`Failed to process sitemap: ${errorMessage}`, 500);
    }
  } catch (error) {
    console.error('Error processing request:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return createErrorResponse(`Failed to process sitemap: ${errorMessage}`, 500);
  }
});
