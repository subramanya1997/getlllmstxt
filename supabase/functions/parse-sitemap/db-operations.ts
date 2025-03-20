// db-operations.ts - Functions for database operations with Supabase

import { SitemapUrl, ProcessingJob, SitemapMetadata } from "./types";

/**
 * Create or update a sitemap record in the database
 * @param supabase Supabase client instance
 * @param sitemapUrl URL of the sitemap
 * @param domain Domain of the sitemap
 * @param urlCount Number of URLs in the sitemap
 * @param userId ID of the user who submitted the sitemap
 * @returns True if operation was successful, false otherwise
 */
export async function createOrUpdateSitemap(
  supabase: any,
  sitemapUrl: string,
  domain: string, 
  urlCount: number,
  userId: string
): Promise<boolean> {
  try {
    // First create/insert a new sitemaps record
    const { error: sitemapError } = await supabase
      .from('sitemaps')
      .insert({
        url: sitemapUrl, 
        domain: domain,
        url_count: urlCount,
        parsed_at: new Date().toISOString(),
        user_id: userId,
        status: 'queued',
        is_latest: true,
        created_at: new Date().toISOString()
      });
    
    if (sitemapError) {
      // Check if this is a duplicate key error for the sitemap URL
      if (sitemapError.message && 
          sitemapError.message.includes("duplicate key value") && 
          sitemapError.message.includes("sitemaps_url_key")) {
        
        console.log("Sitemap already exists, updating existing record");
        
        // Mark all existing records as not latest
        await supabase
          .from('sitemaps')
          .update({ is_latest: false })
          .eq('url', sitemapUrl);
          
        // Insert a new record instead of updating
        const { error: insertError } = await supabase
          .from('sitemaps')
          .insert({
            url: sitemapUrl,
            domain: domain,
            url_count: urlCount,
            parsed_at: new Date().toISOString(),
            status: 'queued',
            updated_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            is_latest: true,
            user_id: userId
          });
          
        if (insertError) {
          console.error(`Failed to insert updated sitemap record:`, insertError);
          return false;
        }
      } else {
        // This is some other error
        console.error(`Failed to create sitemap record:`, sitemapError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`Database error in createOrUpdateSitemap:`, error);
    return false;
  }
}

/**
 * Create a processing job for a sitemap
 * @param supabase Supabase client instance
 * @param sitemapUrl URL of the sitemap to process
 * @param userId ID of the user who submitted the job
 * @param totalUrls Total number of URLs to process
 * @returns The created job ID or null if creation failed
 */
export async function createProcessingJob(
  supabase: any,
  sitemapUrl: string,
  userId: string,
  totalUrls: number
): Promise<string | null> {
  try {
    console.log(`Creating job for sitemap: ${sitemapUrl}, user: ${userId}`);
    console.log(`Supabase client configured: ${!!supabase}`);
    
    // Check if the required environment variables are set
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    console.log(`Environment variables set: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
    
    // Create the job record
    const { data: jobData, error: jobError } = await supabase
      .from('sitemap_jobs')
      .insert({
        sitemap_url: sitemapUrl,
        user_id: userId,
        status: 'queued',
        total_urls: totalUrls,
        processed_urls: 0
      })
      .select('id')
      .single();
    
    if (jobError) {
      console.error(`Failed to create job record. Error code: ${jobError.code}, Message: ${jobError.message}`);
      console.error(`Details:`, JSON.stringify(jobError, null, 2));
      return null;
    }
    
    console.log(`Successfully created job with ID: ${jobData?.id}`);
    return jobData?.id || null;
  } catch (error) {
    console.error(`Database error in createProcessingJob:`, error);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`);
      console.error(`Stack trace: ${error.stack}`);
    }
    return null;
  }
}

/**
 * Update job status and progress
 * @param supabase Supabase client instance
 * @param jobId ID of the job to update
 * @param status New status of the job
 * @param processedUrls Number of URLs processed so far
 * @returns True if update was successful, false otherwise
 */
export async function updateJobStatus(
  supabase: any,
  jobId: string,
  status: string,
  processedUrls: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sitemap_jobs')
      .update({
        status: status,
        processed_urls: processedUrls,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    if (error) {
      console.error(`Failed to update job status:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Database error in updateJobStatus:`, error);
    return false;
  }
}

/**
 * Update status for a URL in the database
 * @param supabase Supabase client instance
 * @param url URL to update
 * @param status New status value
 * @param metadata Optional metadata to update (title, description)
 * @returns True if update was successful, false otherwise
 */
export async function updateUrlStatus(
  supabase: any,
  url: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  metadata?: { title?: string, description?: string, potential_llms_txt?: string | null }
): Promise<boolean> {
  try {
    // Prepare update object
    const updateObj: any = { 
      status, 
      updated_at: new Date().toISOString()
    };
    
    // Add metadata if provided
    if (metadata) {
      if (metadata.title !== undefined) updateObj.title = metadata.title;
      if (metadata.description !== undefined) updateObj.description = metadata.description;
      if (metadata.potential_llms_txt !== undefined) updateObj.potential_llms_txt = metadata.potential_llms_txt;
    }
    
    // Update the URL entry
    const { error } = await supabase
      .from('sitemap_urls')
      .update(updateObj)
      .eq('url', url)
      .eq('is_latest', true);
    
    if (error) {
      console.error(`Error updating URL status for ${url}:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Database error in updateUrlStatus:`, error);
    return false;
  }
}

/**
 * Batch insert sitemap URLs into the database
 * @param supabase Supabase client instance
 * @param urlEntries Array of sitemap URL entries to insert
 * @returns Number of successfully inserted URLs
 */
export async function batchInsertUrls(
  supabase: any,
  urlEntries: SitemapUrl[]
): Promise<number> {
  try {
    if (urlEntries.length === 0) {
      return 0;
    }
    
    // Mark previous entries from this sitemap as not latest
    if (urlEntries.length > 0) {
      const sitemapUrl = urlEntries[0].sitemap_url;
      await supabase
        .from('sitemap_urls')
        .update({ is_latest: false })
        .eq('sitemap_url', sitemapUrl);
    }
    
    // Batch insert the URLs in chunks to avoid hitting request limits
    const BATCH_SIZE = 25;
    let insertedCount = 0;
    
    for (let i = 0; i < urlEntries.length; i += BATCH_SIZE) {
      const batch = urlEntries.slice(i, i + BATCH_SIZE);
      
      // Ensure all entries have required fields
      const processedBatch = batch.map(entry => ({
        ...entry,
        status: entry.status || 'pending', // Initial status is pending
        created_at: entry.created_at || new Date().toISOString(),
        is_latest: entry.is_latest !== undefined ? entry.is_latest : true
      }));
      
      const { error } = await supabase
        .from('sitemap_urls')
        .insert(processedBatch);
      
      if (error) {
        console.error(`Error inserting URL batch ${i}-${i+BATCH_SIZE}:`, error);
      } else {
        insertedCount += batch.length;
      }
    }
    
    return insertedCount;
  } catch (error) {
    console.error(`Database error in batchInsertUrls:`, error);
    return 0;
  }
}

/**
 * Update sitemap status after processing
 * @param supabase Supabase client instance
 * @param sitemapUrl URL of the sitemap to update
 * @param status New status of the sitemap
 * @returns True if update was successful, false otherwise
 */
export async function updateSitemapStatus(
  supabase: any,
  sitemapUrl: string,
  status: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('sitemaps')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('url', sitemapUrl)
      .eq('is_latest', true);
    
    if (error) {
      console.error(`Failed to update sitemap status:`, error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Database error in updateSitemapStatus:`, error);
    return false;
  }
}
