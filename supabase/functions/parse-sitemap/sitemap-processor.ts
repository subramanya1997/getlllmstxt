// sitemap-processor.ts - Core logic for processing sitemaps recursively

import { SitemapUrl } from "./types";
import { processSitemapUrl } from "./sitemap-parser";
import { extractPageMetadata } from "./metadata-extractor";
import { 
  batchInsertUrls, 
  updateJobStatus, 
  updateSitemapStatus,
  updateUrlStatus
} from "./db-operations";

// Default and maximum recursion depth
const DEFAULT_MAX_DEPTH = 10;

/**
 * Process a sitemap recursively and extract all URLs
 * @param sitemapUrl The sitemap URL to process
 * @param domain The domain of the sitemap
 * @param processedSitemaps Set of already processed sitemap URLs
 * @param depth Current recursion depth
 * @param maxDepth Maximum recursion depth (default: 10)
 * @returns Array of all extracted URLs
 */
export async function processSitemapRecursively(
  sitemapUrl: string, 
  domain: string,
  processedSitemaps: Set<string> = new Set<string>(),
  depth: number = 0,
  maxDepth: number = DEFAULT_MAX_DEPTH
): Promise<string[]> {
  // Safety checks
  if (!sitemapUrl || typeof sitemapUrl !== 'string') {
    console.error(`Invalid URL format in processSitemapRecursively: ${sitemapUrl}`);
    return [];
  }
  
  try {
    const normalizedUrl = new URL(sitemapUrl).toString();
    sitemapUrl = normalizedUrl;
  } catch (error) {
    if (!sitemapUrl.startsWith('http')) {
      sitemapUrl = 'https://' + sitemapUrl;
      try {
        new URL(sitemapUrl);
      } catch (e) {
        console.error(`Invalid URL format even after fixing: ${sitemapUrl}`);
        return [];
      }
    } else {
      console.error(`Invalid URL format: ${sitemapUrl}`);
      return [];
    }
  }
  
  // Prevent processing the same sitemap multiple times
  if (processedSitemaps.has(sitemapUrl)) {
    console.log(`Skipping already processed sitemap: ${sitemapUrl}`);
    return [];
  }
  
  // Prevent infinite recursion
  if (depth > maxDepth) {
    console.log(`Maximum recursion depth (${maxDepth}) reached for ${sitemapUrl}, stopping`);
    return [];
  }
  
  console.log(`Processing sitemap at depth ${depth}/${maxDepth}: ${sitemapUrl}`);
  processedSitemaps.add(sitemapUrl);
  
  try {
    // Process the sitemap URL to get its content
    const result = await processSitemapUrl(sitemapUrl);
    
    // If this is a sitemap index, recursively process each nested sitemap
    if (result.isSitemapIndex) {
      console.log(`${sitemapUrl} is a sitemap index with ${result.urls.length} nested sitemaps`);
      
      // Collect all URLs from nested sitemaps
      const allNestedUrls: string[] = [];
      const errors: Error[] = [];
      
      // Process nested sitemaps in parallel with concurrency limit
      const concurrencyLimit = 5; // Process up to 5 sitemaps at once
      const nestedSitemaps = [...result.urls]; // Copy to avoid modifying the original
      
      while (nestedSitemaps.length > 0) {
        // Take a batch of sitemaps to process
        const batch = nestedSitemaps.splice(0, concurrencyLimit);
        
        // Process the batch in parallel
        const batchResults = await Promise.allSettled(
          batch.map(nestedSitemapUrl => 
            processSitemapRecursively(
              nestedSitemapUrl,
              domain,
              processedSitemaps,
              depth + 1,
              maxDepth
            )
          )
        );
        
        // Collect results and errors
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            allNestedUrls.push(...result.value);
          } else {
            console.error(`Error processing nested sitemap ${batch[index]}:`, result.reason);
            errors.push(result.reason);
          }
        });
      }
      
      if (errors.length > 0) {
        console.warn(`Encountered ${errors.length} errors while processing nested sitemaps`);
      }
      
      return allNestedUrls;
    } else {
      // This is a regular sitemap with page URLs
      console.log(`${sitemapUrl} is a regular sitemap with ${result.urls.length} URLs`);
      return result.urls;
    }
  } catch (error) {
    console.error(`Error processing sitemap ${sitemapUrl}:`, error);
    return [];
  }
}

/**
 * Process URLs in background and update job status
 * @param sitemapUrl The sitemap URL being processed
 * @param extractedUrls Array of URLs extracted from the sitemap
 * @param domain Domain of the sitemap
 * @param jobId ID of the processing job
 * @param userId ID of the user who submitted the job
 * @param supabase Supabase client instance
 */
export async function processSitemapInBackground(
  sitemapUrl: string,
  extractedUrls: string[],
  domain: string,
  jobId: string,
  userId: string,
  supabase: any
) {
  try {
    console.log(`Starting background processing of sitemap: ${sitemapUrl}`);
    
    // Update job status to processing
    await updateJobStatus(supabase, jobId, 'processing', 0);
    
    // Update sitemap status to processing
    await updateSitemapStatus(supabase, sitemapUrl, 'processing');
    
    // Process URLs in batches
    const BATCH_SIZE = 50; // Increased from 25 for better performance
    const totalUrls = extractedUrls.length;
    let processedCount = 0;
    let successCount = 0;
    let failureCount = 0;
    
    // Process in batches to avoid memory issues with large sitemaps
    for (let i = 0; i < totalUrls; i += BATCH_SIZE) {
      const urlBatch = extractedUrls.slice(i, i + BATCH_SIZE);
      const urlEntries: SitemapUrl[] = [];
      
      // First create entries with 'processing' status for all URLs in this batch
      for (const url of urlBatch) {
        urlEntries.push({
          url: url,
          domain: domain,
          sitemap_url: sitemapUrl,
          potential_llms_txt: null,
          title: '',
          description: '',
          user_id: userId,
          status: 'processing',
          created_at: new Date().toISOString(),
          is_latest: true
        });
      }
      
      // Insert all URLs in this batch with 'processing' status
      try {
        await batchInsertUrls(supabase, urlEntries);
      } catch (batchError) {
        console.error(`Error batch inserting URLs:`, batchError);
      }
      
      // Process each URL in the batch to extract metadata
      const metadataPromises = urlBatch.map(async (url, index) => {
        try {
          // Extract metadata from URL
          const { title, description } = await extractPageMetadata(url);
          
          // Determine potential llms.txt url
          let potentialLLMsTxt: string | null = null;
          try {
            const urlObj = new URL(url);
            potentialLLMsTxt = `${urlObj.protocol}//${urlObj.hostname}/llms.txt`;
          } catch (error) {
            console.error(`Invalid URL format: ${url}`, error);
          }
          
          // Update URL status to completed with metadata
          await updateUrlStatus(supabase, url, 'completed', {
            title,
            description,
            potential_llms_txt: potentialLLMsTxt
          });
          
          successCount++;
          return { success: true, url };
        } catch (urlError) {
          console.error(`Error processing URL ${url}:`, urlError);
          
          // Mark as failed
          try {
            await updateUrlStatus(supabase, url, 'failed');
          } catch (updateError) {
            console.error(`Error updating URL status for ${url}:`, updateError);
          }
          
          failureCount++;
          return { success: false, url, error: urlError };
        }
      });
      
      // Wait for all URLs in this batch to be processed
      await Promise.allSettled(metadataPromises);
      
      // Update processed count and job status
      processedCount += urlBatch.length;
      await updateJobStatus(supabase, jobId, 'processing', processedCount);
      console.log(`Processed ${processedCount}/${totalUrls} URLs (${successCount} success, ${failureCount} failed)`);
    }
    
    // Mark job as completed
    await updateJobStatus(supabase, jobId, 'completed', processedCount);
    
    // Mark sitemap as completed
    await updateSitemapStatus(supabase, sitemapUrl, 'completed');
    
    console.log(`Completed processing sitemap: ${sitemapUrl} (${successCount} success, ${failureCount} failed)`);
  } catch (error) {
    console.error(`Background processing error:`, error);
    
    // Mark job as failed
    await updateJobStatus(supabase, jobId, 'failed', 0);
    
    // Mark sitemap as failed
    await updateSitemapStatus(supabase, sitemapUrl, 'failed');
  }
}
