// Follow this pattern to use Deno's native fetch API
// @ts-ignore: Deno module
// @deno-types="https://deno.land/std@0.168.0/http/server.d.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts" 
// @ts-ignore: Deno module
// @deno-types="https://esm.sh/v126/@supabase/supabase-js@2.23.0/dist/module/index.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// @ts-ignore: Deno module
import { parse as parseXML } from "https://deno.land/x/xml@2.1.1/mod.ts";
// @ts-ignore: Local module
import { corsHeaders } from '../_shared/cors.ts'; 

// Define the request parameter type
interface RequestType extends Request {
  method: string;
  headers: Headers;
}

interface SitemapUrl {
  url: string;
  domain: string;
  sitemap_url: string;
  potential_llms_txt: string | null;
  title?: string;
  description?: string;
  user_id?: string;
  status?: string;
}

interface SitemapMetadata {
  url: string;
  domain: string;
  url_count: number;
  parsed_at: string;
  user_id?: string;
  status: string;
}

interface ProcessingJob {
  id: string;
  sitemap_url: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_urls?: number;
  processed_urls?: number;
}

// Declare Deno namespace for TypeScript
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

/**
 * Extracts metadata (title, description) from a web page
 */
async function extractPageMetadata(url: string): Promise<{ title: string; description: string }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; getlllmstxt/1.0; +https://getlllmstxt.com/bot)'
      }
    });
    
    if (!response.ok) {
      return { title: '', description: '' };
    }
    
    const html = await response.text();
    
    // Extract title
    let title = '';
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }
    
    // Extract description
    let description = '';
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i) || 
                      html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
    if (descMatch && descMatch[1]) {
      description = descMatch[1].trim();
    }
    
    return { title, description };
  } catch (error) {
    console.error(`Error fetching metadata for ${url}:`, error);
    return { title: '', description: '' };
  }
}

/**
 * Process URLs in background and update job status
 */
async function processSitemapInBackground(
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
    await supabase
      .from('sitemap_jobs')
      .update({ 
        status: 'processing',
        total_urls: extractedUrls.length,
        processed_urls: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
    
    // Update sitemap status to processing
    await supabase
      .from('sitemaps')
      .update({
        status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('url', sitemapUrl);
    
    // Process URLs in smaller batches
    const BATCH_SIZE = 5; // Smaller batch size to avoid rate limiting
    let processedCount = 0;
    
    for (let i = 0; i < extractedUrls.length; i += BATCH_SIZE) {
      const batch = extractedUrls.slice(i, i + BATCH_SIZE);
      const urlsToInsert: SitemapUrl[] = [];
      
      // Process each URL in parallel
      await Promise.all(batch.map(async (url) => {
        let urlDomain = "";
        try {
          const urlObj = new URL(url);
          urlDomain = urlObj.hostname;
        } catch (e) {
          console.error("Invalid URL:", url);
        }
        
        // Fetch metadata from the page
        const { title, description } = await extractPageMetadata(url);
        
        urlsToInsert.push({
          url: url,
          domain: urlDomain,
          sitemap_url: sitemapUrl,
          potential_llms_txt: urlDomain ? `https://${urlDomain}/llms.txt` : null,
          title: title,
          description: description,
          user_id: userId
        });
      }));
      
      // Store URLs with metadata
      const { error: urlsError } = await supabase
        .from('sitemap_urls')
        .upsert(urlsToInsert);
      
      if (urlsError) {
        console.error(`Error storing URLs batch ${i}-${i+batch.length}:`, urlsError);
      }
      
      // Update job progress
      processedCount += batch.length;
      await supabase
        .from('sitemap_jobs')
        .update({ 
          processed_urls: processedCount,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId);
        
      // Avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Update job and sitemap status to completed
    await supabase
      .from('sitemap_jobs')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    await supabase
      .from('sitemaps')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('url', sitemapUrl);
      
    // Send notification to the user (you might want to implement a more robust notification system)
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message: `Sitemap processing completed for ${sitemapUrl}. Processed ${processedCount} URLs.`,
        type: 'sitemap_processed',
        data: { sitemap_url: sitemapUrl, job_id: jobId }
      });
      
    console.log(`Completed background processing of sitemap: ${sitemapUrl}`);
    
  } catch (error) {
    console.error("Error in background processing:", error);
    
    // Update job status to failed
    await supabase
      .from('sitemap_jobs')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', jobId);
      
    await supabase
      .from('sitemaps')
      .update({ 
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('url', sitemapUrl);
      
    // Send failure notification
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        message: `Sitemap processing failed for ${sitemapUrl}. Please try again.`,
        type: 'sitemap_failed',
        data: { sitemap_url: sitemapUrl, job_id: jobId }
      });
  }
}

serve(async (req: RequestType) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Check if the request is POST
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Parse request body
    const { sitemapUrl, userId } = await req.json();
    
    if (!sitemapUrl) {
      return new Response(JSON.stringify({ error: 'Sitemap URL is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!userId) {
      return new Response(JSON.stringify({ error: 'User ID is required' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Create Supabase client with auth context from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), { 
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Initialize Supabase client - Using custom environment variable names
    // that don't start with SUPABASE_ (which is restricted)
    const supabaseUrl = Deno.env.get('DB_URL') || 'https://nxaldvxrfayypmxmpbwo.supabase.co';
    const supabaseKey = Deno.env.get('DB_SERVICE_KEY') || '';
    
    if (!supabaseKey) {
      return new Response(JSON.stringify({ 
        error: 'Database connection information is missing. Please check environment variables.' 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Connecting to Supabase at URL: ${supabaseUrl}`);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false,
      }
    });
    
    // Fetch the sitemap
    console.log(`Fetching sitemap: ${sitemapUrl}`);
    const response = await fetch(sitemapUrl);
    
    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Failed to fetch sitemap: ${response.statusText}` }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    const xmlText = await response.text();
    
    // Parse the XML - using Deno XML parser
    try {
      const xmlDoc = parseXML(xmlText);
      
      // Extract URLs from both standard sitemap and sitemap index formats
      const extractedUrls: string[] = [];
      
      // Improved helper function to extract URLs from xmlDoc
      function extractUrlsFromXml(doc: any) {
        const urls: string[] = [];
        
        // Function to recursively search for loc elements
        function findLocElements(node: any) {
          if (!node) return;
          
          // Check if this is a loc element with text content
          if (typeof node === 'object' && node.name && 
              (node.name === 'loc' || node.name.endsWith(':loc')) && 
              node.children && node.children.length > 0 && 
              typeof node.children[0].text === 'string') {
            urls.push(node.children[0].text.trim());
            return;
          }
          
          // If this is an object with children, process each child
          if (typeof node === 'object') {
            // Process children array if it exists
            if (node.children && Array.isArray(node.children)) {
              for (const child of node.children) {
                findLocElements(child);
              }
            }
            
            // Process other properties that might be objects
            for (const key in node) {
              if (typeof node[key] === 'object' && key !== 'children') {
                findLocElements(node[key]);
              }
            }
          }
        }
        
        findLocElements(doc);
        return urls;
      }
      
      // Use simpler, more robust extraction that ignores namespaces
      extractedUrls.push(...extractUrlsFromXml(xmlDoc));
      
      console.log(`Found ${extractedUrls.length} URLs in sitemap`);
      
      if (extractedUrls.length === 0) {
        // Fallback: Try regex-based extraction for simple cases
        const locRegex = /<loc[^>]*>(.*?)<\/loc>/gi;
        let match;
        while ((match = locRegex.exec(xmlText)) !== null) {
          if (match[1] && match[1].trim()) {
            extractedUrls.push(match[1].trim());
          }
        }
        
        console.log(`Regex fallback found ${extractedUrls.length} URLs`);
        
        if (extractedUrls.length === 0) {
          return new Response(JSON.stringify({ 
            success: true, 
            urls: [], 
            message: "No URLs found in the sitemap" 
          }), { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Extract domain from sitemap URL
      let domain = "";
      try {
        const urlObj = new URL(sitemapUrl);
        domain = urlObj.hostname;
      } catch (e) {
        console.error("Invalid sitemap URL:", sitemapUrl);
      }
      
      // CRITICAL CHANGE: First create/upsert the sitemaps record before creating the job
      const { error: sitemapError } = await supabase
        .from('sitemaps')
        .upsert({
          url: sitemapUrl, 
          domain: domain,
          url_count: extractedUrls.length,
          parsed_at: new Date().toISOString(),
          user_id: userId,
          status: 'queued'
        });
      
      if (sitemapError) {
        // Check if this is a duplicate key error for the sitemap URL
        if (sitemapError.message && 
            sitemapError.message.includes("duplicate key value") && 
            sitemapError.message.includes("sitemaps_url_key")) {
          
          console.log("Sitemap already exists, proceeding with job creation");
          
          // Update the existing sitemap record to mark it as being reprocessed
          await supabase
            .from('sitemaps')
            .update({
              url_count: extractedUrls.length,
              parsed_at: new Date().toISOString(),
              status: 'queued',
              updated_at: new Date().toISOString()
            })
            .eq('url', sitemapUrl);
            
        } else {
          // This is some other error, return an error response
          return new Response(JSON.stringify({ 
            error: `Failed to create sitemap record: ${sitemapError.message}` 
          }), { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }
      
      // Now create the job record after the sitemap exists
      const { data: jobData, error: jobError } = await supabase
        .from('sitemap_jobs')
        .insert({
          sitemap_url: sitemapUrl,
          user_id: userId,
          status: 'queued',
          total_urls: extractedUrls.length,
          processed_urls: 0
        })
        .select('id')
        .single();
      
      if (jobError) {
        return new Response(JSON.stringify({ 
          error: `Failed to create job record: ${jobError.message}` 
        }), { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      const jobId = jobData.id;
      
      // Start processing in the background
      processSitemapInBackground(sitemapUrl, extractedUrls, domain, jobId, userId, supabase);
      
      // Return immediate response with job info
      return new Response(JSON.stringify({ 
        success: true,
        message: "Sitemap processing started",
        job_id: jobId,
        total_urls: extractedUrls.length,
        status: "queued"
      }), { 
        status: 202, // Accepted
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
      
    } catch (parseError: unknown) {
      console.error("XML parsing error:", parseError);
      
      // Try regex-based fallback extraction if parsing failed
      try {
        const extractedUrls: string[] = [];
        const locRegex = /<loc[^>]*>(.*?)<\/loc>/gi;
        let match;
        
        while ((match = locRegex.exec(xmlText)) !== null) {
          if (match[1] && match[1].trim()) {
            extractedUrls.push(match[1].trim());
          }
        }
        
        console.log(`Regex fallback found ${extractedUrls.length} URLs`);
        
        if (extractedUrls.length > 0) {
          // Extract domain from sitemap URL
          let domain = "";
          try {
            const urlObj = new URL(sitemapUrl);
            domain = urlObj.hostname;
          } catch (e) {
            console.error("Invalid sitemap URL:", sitemapUrl);
          }
          
          // First create/upsert the sitemaps record
          const { error: sitemapError } = await supabase
            .from('sitemaps')
            .upsert({
              url: sitemapUrl, 
              domain: domain,
              url_count: extractedUrls.length,
              parsed_at: new Date().toISOString(),
              user_id: userId,
              status: 'queued'
            });
          
          if (sitemapError) {
            // Check if this is a duplicate key error for the sitemap URL
            if (sitemapError.message && 
                sitemapError.message.includes("duplicate key value") && 
                sitemapError.message.includes("sitemaps_url_key")) {
              
              console.log("Sitemap already exists in regex fallback, proceeding with job creation");
              
              // Update the existing sitemap record to mark it as being reprocessed
              await supabase
                .from('sitemaps')
                .update({
                  url_count: extractedUrls.length,
                  parsed_at: new Date().toISOString(),
                  status: 'queued',
                  updated_at: new Date().toISOString()
                })
                .eq('url', sitemapUrl);
                
            } else {
              // This is some other error, return an error response
              return new Response(JSON.stringify({ 
                error: `Failed to create sitemap record: ${sitemapError.message}` 
              }), { 
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
            }
          }
          
          // Then create the job record
          const { data: jobData, error: jobError } = await supabase
            .from('sitemap_jobs')
            .insert({
              sitemap_url: sitemapUrl,
              user_id: userId,
              status: 'queued',
              total_urls: extractedUrls.length,
              processed_urls: 0
            })
            .select('id')
            .single();
          
          if (jobError) {
            return new Response(JSON.stringify({ 
              error: `Failed to create job record: ${jobError.message}` 
            }), { 
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          const jobId = jobData.id;
          
          // Start processing in the background using regex results
          processSitemapInBackground(sitemapUrl, extractedUrls, domain, jobId, userId, supabase);
          
          return new Response(JSON.stringify({ 
            success: true,
            message: "Sitemap processing started using regex fallback",
            job_id: jobId,
            total_urls: extractedUrls.length,
            status: "queued"
          }), { 
            status: 202, // Accepted
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      } catch (regexError) {
        console.error("Regex fallback error:", regexError);
      }
      
      const errorMessage = parseError instanceof Error ? parseError.message : "Unknown error";
      return new Response(JSON.stringify({ 
        error: `Failed to parse sitemap XML: ${errorMessage}` 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  } catch (error: unknown) {
    console.error("Error processing request:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: `Internal server error: ${errorMessage}` 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 