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

/**
 * Process a sitemap recursively and extract all URLs
 * @param sitemapUrl The sitemap URL to process
 * @param domain The domain of the sitemap
 * @param processedSitemaps Set of already processed sitemap URLs
 * @param depth Current recursion depth
 * @returns Array of all extracted URLs
 */
export async function processSitemapRecursively(
  sitemapUrl: string, 
  domain: string,
  processedSitemaps: Set<string> = new Set<string>(),
  depth: number = 0
): Promise<string[]> {
  // Safety checks
  if (!sitemapUrl || typeof sitemapUrl !== 'string' || !sitemapUrl.startsWith('http')) {
    console.error(`Invalid URL format in processSitemapRecursively: ${sitemapUrl}`);
    return [];
  }
  
  // Prevent processing the same sitemap multiple times
  if (processedSitemaps.has(sitemapUrl)) {
    console.log(`Skipping already processed sitemap: ${sitemapUrl}`);
    return [];
  }
  
  // Prevent infinite recursion
  if (depth > 5) {
    console.log(`Maximum recursion depth reached for ${sitemapUrl}, stopping`);
    return [];
  }
  
  console.log(`Processing sitemap at depth ${depth}: ${sitemapUrl}`);
  processedSitemaps.add(sitemapUrl);
  
  try {
    // Process the sitemap URL to get its content
    const result = await processSitemapUrl(sitemapUrl);
    
    // If this is a sitemap index, recursively process each nested sitemap
    if (result.isSitemapIndex) {
      console.log(`${sitemapUrl} is a sitemap index with ${result.urls.length} nested sitemaps`);
      
      // Collect all URLs from nested sitemaps
      const allNestedUrls: string[] = [];
      
      for (const nestedSitemapUrl of result.urls) {
        const nestedUrls = await processSitemapRecursively(
          nestedSitemapUrl,
          domain,
          processedSitemaps,
          depth + 1
        );
        allNestedUrls.push(...nestedUrls);
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
    
    // Process each URL
    const urlEntries: SitemapUrl[] = [];
    let processedCount = 0;
    
    for (const url of extractedUrls) {
      try {
        // First create an entry with 'processing' status
        urlEntries.push({
          url: url,
          domain: domain,
          sitemap_url: sitemapUrl,
          potential_llms_txt: null, // Will be updated later
          title: '', // Will be updated later - using empty string instead of null
          description: '', // Will be updated later - using empty string instead of null
          user_id: userId,
          status: 'processing', // Mark as processing
          created_at: new Date().toISOString(),
          is_latest: true
        });
        
        // Batch insert if needed to ensure URL is in database with 'processing' status
        if (urlEntries.length >= 25) {
          await batchInsertUrls(supabase, urlEntries);
          urlEntries.length = 0; // Clear the array
        }
        
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

        // If we haven't inserted the URL yet, include it in the next batch
        if (urlEntries.length > 0 && urlEntries.some(entry => entry.url === url)) {
          // Update the entry in the pending batch
          const index = urlEntries.findIndex(entry => entry.url === url);
          if (index !== -1) {
            urlEntries[index].title = title;
            urlEntries[index].description = description;
            urlEntries[index].potential_llms_txt = potentialLLMsTxt;
            urlEntries[index].status = 'completed'; // Mark as completed
          }
        } else {
          // URL was already inserted, update its status to completed
          await updateUrlStatus(supabase, url, 'completed', {
            title,
            description,
            potential_llms_txt: potentialLLMsTxt
          });
        }
        
        // Update progress every 10 items
        processedCount++;
        if (processedCount % 10 === 0 || processedCount === extractedUrls.length) {
          await updateJobStatus(supabase, jobId, 'processing', processedCount);
          console.log(`Processed ${processedCount}/${extractedUrls.length} URLs`);
        }
        
        // Batch insert any remaining entries at the end
        if (processedCount === extractedUrls.length && urlEntries.length > 0) {
          await batchInsertUrls(supabase, urlEntries);
          urlEntries.length = 0; // Clear the array
        }
      } catch (urlError) {
        console.error(`Error processing URL ${url}:`, urlError);
      }
    }
    
    // Mark job as completed
    await updateJobStatus(supabase, jobId, 'completed', extractedUrls.length);
    
    // Mark sitemap as completed
    await updateSitemapStatus(supabase, sitemapUrl, 'completed');
    
    console.log(`Completed processing sitemap: ${sitemapUrl}`);
  } catch (error) {
    console.error(`Background processing error:`, error);
    
    // Mark job as failed
    await updateJobStatus(supabase, jobId, 'failed', 0);
    
    // Mark sitemap as failed
    await updateSitemapStatus(supabase, sitemapUrl, 'failed');
  }
}
