import { supabaseClient } from "@/lib/supabase-client";


// Use the pre-initialized Supabase client
const supabase = supabaseClient;

// Function to parse sitemap locally as a fallback
export const parseLocalSitemap = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
  }
  
  const xmlText = await response.text();
  
  // Parse the XML
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  
  // Extract URLs from both standard sitemap and sitemap index formats
  const extractedUrls: string[] = [];
  
  // Check for standard sitemap format (has <url> elements)
  const urlElements = xmlDoc.getElementsByTagName("url");
  for (let i = 0; i < urlElements.length; i++) {
    const locElement = urlElements[i].getElementsByTagName("loc")[0];
    if (locElement && locElement.textContent) {
      extractedUrls.push(locElement.textContent);
    }
  }
  
  // Check for sitemap index format (has <sitemap> elements)
  const sitemapElements = xmlDoc.getElementsByTagName("sitemap");
  for (let i = 0; i < sitemapElements.length; i++) {
    const locElement = sitemapElements[i].getElementsByTagName("loc")[0];
    if (locElement && locElement.textContent) {
      extractedUrls.push(locElement.textContent);
    }
  }
  
  return extractedUrls;
};

// Function to store data in Supabase directly from the client
export const storeInSupabase = async (
  sitemapUrl: string, 
  extractedUrls: string[], 
  userId: string | undefined
) => {
  try {
    // Extract domain from sitemap URL
    let domain = "";
    try {
      const urlObj = new URL(sitemapUrl);
      domain = urlObj.hostname;
    } catch {
      console.error("Invalid sitemap URL:", sitemapUrl);
    }
    
    // Store sitemap metadata
    const { error: sitemapError } = await supabase
      .from('sitemaps')
      .upsert({ 
        url: sitemapUrl, 
        domain: domain,
        url_count: extractedUrls.length,
        parsed_at: new Date().toISOString(),
        user_id: userId || null,
        status: 'completed'
      });
      
    if (sitemapError) {
      console.error("Error storing sitemap data:", sitemapError);
      return 0;
    }
    
    // Prepare URLs for storage
    const urlsToInsert = extractedUrls.map(url => {
      let urlDomain = "";
      try {
        const urlObj = new URL(url);
        urlDomain = urlObj.hostname;
      } catch {
        console.error("Invalid URL:", url);
      }
      
      return {
        url: url,
        domain: urlDomain,
        sitemap_url: sitemapUrl,
        potential_llms_txt: urlDomain ? `https://${urlDomain}/llms.txt` : null,
        user_id: userId || null
      };
    });
    
    // Insert URLs in batches to avoid payload size limits
    const BATCH_SIZE = 25;
    let successCount = 0;
    
    for (let i = 0; i < urlsToInsert.length; i += BATCH_SIZE) {
      const batch = urlsToInsert.slice(i, i + BATCH_SIZE);
      const { error: urlsError } = await supabase
        .from('sitemap_urls')
        .upsert(batch);
        
      if (urlsError) {
        console.error(`Error storing URLs batch ${i}-${i+batch.length}:`, urlsError);
      } else {
        successCount += batch.length;
      }
    }
    
    return successCount;
  } catch (error) {
    console.error("Error storing in Supabase:", error);
    return 0;
  }
};

// Function to call the parse-sitemap Supabase function
export const callParseSitemapFunction = async (
  sitemapUrl: string,
  userId: string,
  accessToken?: string
): Promise<{ jobId: string | null; error: string | null }> => {
  try {
    // Extract domain from sitemap URL
    let domain = "";
    try {
      const urlObj = new URL(sitemapUrl);
      domain = urlObj.hostname;
    } catch (e) {
      console.error("Invalid sitemap URL:", sitemapUrl, e);
      return { jobId: null, error: "Invalid sitemap URL" };
    }

    // Call the Supabase Function
    const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.functions.supabase.co') || '';
    const response = await fetch(`${apiUrl}/functions/v1/parse-sitemap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { 'Authorization': `Bearer ${accessToken}` } : {})
      },
      body: JSON.stringify({
        sitemapUrl,
        userId,
        domain,
        recursive: true,
        maxDepth: 5
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Parse sitemap API error: ${response.status} - ${errorText}`);
      return { 
        jobId: null, 
        error: `API Error (${response.status}): ${errorText.substring(0, 100)}` 
      };
    }

    const data = await response.json();
    console.log('Parse sitemap function response:', data);
    
    // The API returns jobId directly in the response
    return { 
      jobId: data.jobId || null, 
      error: null 
    };
  } catch (error) {
    console.error('Error calling parse-sitemap function:', error);
    return { 
      jobId: null, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
};

// Function to calculate and format progress percentage
export const calculateProgress = (processed: number, total: number) => {
  if (!total) return "0%";
  const percentage = Math.round((processed / total) * 100);
  return `${percentage}%`;
}; 