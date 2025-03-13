"use client"

import { useState } from "react"
import { toast } from "@/hooks/use-toast"
import { SitemapForm } from "./components/SitemapForm"
import { JobsTable } from "./components/JobsTable"
import { SitemapsTable } from "./components/SitemapsTable"
import { UrlsList } from "./components/UrlsList"
import { useUserJobs, useUserSitemaps, useAutoRefresh, useSitemapUrls } from "./hooks"
import { parseLocalSitemap, storeInSupabase } from "./utils"
import { Sitemap, SitemapJob, StorageStatus } from "./types"
import { supabaseClient } from "@/lib/supabase-client"
import { useUser } from "@/lib/user-provider"

// Use the pre-initialized Supabase client
const supabase = supabaseClient;

// Define a type for the user hook instead of using any
type UserHookResult = {
  session: { user?: { id: string }, access_token?: string } | null;
  isLoading: boolean;
};

// Import the user hook safely
let userHook: () => UserHookResult;
try {
  userHook = useUser;
} catch {
  console.warn("Using mock user provider for type checking");
  userHook = () => ({ session: null, isLoading: false });
}

export default function PlaygroundPage() {
  const [urls, setUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [storageStatus, setStorageStatus] = useState<StorageStatus>("none")
  const [processingJobId, setProcessingJobId] = useState<string | null>(null)
  
  const { session } = userHook()
  const userId = session?.user?.id
  
  // Custom hooks
  const { userJobs, loadingJobs, fetchUserJobs } = useUserJobs(userId);
  const { userSitemaps, loadingSitemaps, fetchUserSitemaps } = useUserSitemaps(userId);
  const { loadSitemapUrls } = useSitemapUrls();
  
  // Handle job completion
  const handleJobCompletion = async (job: SitemapJob) => {
    setProcessingJobId(null);
    
    // If it's completed, try to fetch the processed URLs
    if (job.status.toLowerCase() === 'completed') {
      const { data } = await supabase
        .from('sitemap_urls')
        .select('url')
        .eq('sitemap_url', job.sitemap_url)
        .limit(100);
        
      if (data && data.length > 0) {
        setUrls(data.map(item => item.url));
        setStorageStatus("full");
        
        toast({
          title: "Processing Completed",
          description: `Successfully processed ${job.processed_urls} URLs from ${job.sitemap_url}`,
        });
      }
    } else if (job.status.toLowerCase() === 'failed') {
      toast({
        title: "Processing Failed",
        description: `Failed to process ${job.sitemap_url}. Please try again.`,
        variant: "destructive",
      });
    }
  };
  
  // Auto-refresh hook
  const { autoRefresh, setAutoRefresh } = useAutoRefresh(
    userJobs,
    fetchUserJobs,
    fetchUserSitemaps,
    processingJobId,
    handleJobCompletion
  );
  
  // Handle refresh button click for jobs table
  const handleJobsRefreshClick = () => {
    if (loadingJobs) return;
    
    if (autoRefresh) {
      // If auto-refresh is on, turn it off
      setAutoRefresh(false);
    } else {
      // If auto-refresh is off, do a manual refresh and turn it on
      fetchUserJobs();
      fetchUserSitemaps();
      setAutoRefresh(true);
    }
  };
  
  // Handle job row click
  const handleJobClick = async (job: SitemapJob) => {
    const result = await loadSitemapUrls(job.sitemap_url, job.status);
    if (result) {
      setUrls(result.urls);
      setStorageStatus(result.storageStatus);
    }
  };
  
  // Handle sitemap row click
  const handleSitemapClick = async (sitemap: Sitemap) => {
    const result = await loadSitemapUrls(sitemap.url, sitemap.status);
    if (result) {
      setUrls(result.urls);
      setStorageStatus(result.storageStatus);
    }
  };

  // Handle form submission
  const handleSubmit = async (sitemapUrl: string) => {
    if (!sitemapUrl) {
      toast({
        title: "Error",
        description: "Please enter a sitemap URL",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    setUrls([])
    setStorageStatus("none")
    setProcessingJobId(null)

    try {
      let extractedUrls: string[] = [];
      let storedCount = 0;
      const accessToken = session?.access_token;
      
      // Try to use Edge Function if we have an access token, user ID, and Supabase URL
      if (accessToken && userId && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          console.log("Calling Edge Function to parse sitemap");
          
          // Call the Edge Function to parse the sitemap
          const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/parse-sitemap`;
          console.log(`Using edge function URL: ${edgeFunctionUrl}`);
          
          const response = await fetch(edgeFunctionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ 
              sitemapUrl,
              userId 
            }),
          });
          
          const data = await response.json();
          console.log("Edge function response:", data);
          
          if (!response.ok) {
            // Check if this is a duplicate sitemap error
            if (data.error && data.error.includes("duplicate key value") && data.error.includes("sitemaps_url_key")) {
              // This is a duplicate sitemap, show a more friendly message
              toast({
                title: "Sitemap Already Exists",
                description: "This sitemap has been processed before. Creating a new job to refresh the data.",
              });
              
              // We still continue with the flow, the backend should handle the duplicate
            } else {
              // This is some other error
              console.warn("Edge function error, falling back to local parsing:", data);
              throw new Error(data.error || `Server responded with status: ${response.status}`);
            }
          }
          
          // If the job was created successfully
          if (data.success && data.job_id) {
            setProcessingJobId(data.job_id);
            setStorageStatus("partial"); // Mark as partial since processing started
            
            toast({
              title: "Processing started",
              description: `Sitemap processing has begun. Found ${data.total_urls || 0} URLs to process.`,
            });
            
            // Fetch initial URLs for display (this part is optional)
            const { data: initialUrls } = await supabase
              .from('sitemap_urls')
              .select('url')
              .eq('sitemap_url', sitemapUrl)
              .limit(100);
              
            if (initialUrls && initialUrls.length > 0) {
              extractedUrls = initialUrls.map(item => item.url);
              storedCount = initialUrls.length;
            } else {
              // If no URLs are available yet, show a message
              toast({
                title: "Processing in background",
                description: "URLs are being processed in the background. Check back later for results.",
              });
            }
            
            // Refresh the job list and sitemaps list to show the new data
            fetchUserJobs();
            fetchUserSitemaps();
          } else {
            // Fall back to local parsing if the job wasn't created properly
            extractedUrls = await parseLocalSitemap(sitemapUrl);
            
            // If we're authenticated, try storing directly
            if (session) {
              storedCount = await storeInSupabase(sitemapUrl, extractedUrls, userId);
            }
          }
        } catch (edgeFnError) {
          console.warn("Edge function error, falling back to local parsing:", edgeFnError);
          
          // Fall back to local parsing
          extractedUrls = await parseLocalSitemap(sitemapUrl);
          
          // If we're authenticated, try storing directly
          if (session) {
            storedCount = await storeInSupabase(sitemapUrl, extractedUrls, userId);
          }
        }
      } else {
        // No auth token, user ID, or Supabase URL, use local parsing
        extractedUrls = await parseLocalSitemap(sitemapUrl);
        
        // If we're authenticated, try storing directly
        if (session) {
          storedCount = await storeInSupabase(sitemapUrl, extractedUrls, userId);
        }
      }
      
      // Update state with extracted URLs
      setUrls(extractedUrls);
      
      // Update storage status
      if (storedCount === 0 && !processingJobId) {
        setStorageStatus("none");
      } else if (processingJobId || (storedCount > 0 && storedCount < extractedUrls.length)) {
        setStorageStatus("partial");
      } else if (storedCount >= extractedUrls.length) {
        setStorageStatus("full");
      }
      
      if (extractedUrls.length === 0 && !processingJobId) {
        toast({
          title: "No URLs found",
          description: "The sitemap didn't contain any valid URLs",
          variant: "destructive",
        });
      } else if (extractedUrls.length > 0 && !processingJobId) {
        toast({
          title: "Success",
          description: `Found ${extractedUrls.length} URLs from the sitemap${
            storedCount > 0 ? ` (${storedCount} stored)` : ''
          }`,
        });
      }
    } catch (error) {
      console.error("Error parsing sitemap:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to parse sitemap",
        variant: "destructive",
      });
      setStorageStatus("none");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-col h-24 shrink-0 items-start justify-center gap-1 px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-16">
        <h1 className="text-lg font-semibold">Playground</h1>
        <p className="text-sm text-muted-foreground">Discover and analyze website llms.txt files to enhance AI-driven search capabilities.</p>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <SitemapForm 
          onSubmit={handleSubmit}
          loading={loading}
          storageStatus={storageStatus}
          processingJobId={processingJobId}
          isAuthenticated={!!session}
        />
        
        {session && (
          <>
            <JobsTable 
              jobs={userJobs}
              loading={loadingJobs}
              autoRefresh={autoRefresh}
              onRefreshClick={handleJobsRefreshClick}
              onJobClick={handleJobClick}
            />

            <SitemapsTable 
              sitemaps={userSitemaps}
              loading={loadingSitemaps}
              onRefreshClick={fetchUserSitemaps}
              onSitemapClick={handleSitemapClick}
            />
          </>
        )}
        
        <UrlsList urls={urls} storageStatus={storageStatus} />
      </div>
    </div>
  )
} 