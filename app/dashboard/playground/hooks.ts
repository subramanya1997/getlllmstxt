import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { SitemapJob, Sitemap } from "./types";
import { supabaseClient } from "@/lib/supabase-client";

// Use the pre-initialized Supabase client
const supabase = supabaseClient;

// Hook for fetching and managing user jobs
export function useUserJobs(userId: string | undefined) {
  const [userJobs, setUserJobs] = useState<SitemapJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  const fetchUserJobs = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoadingJobs(true);
      const { data, error } = await supabase
        .from('sitemap_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
        console.log("Fetched jobs:", data, userId);
        
      if (error) {
        console.error("Error fetching user jobs:", error);
        return;
      }
      
      setUserJobs(data || []);
    } catch (error) {
      console.error("Error fetching user jobs:", error);
    } finally {
      setLoadingJobs(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserJobs();
    }
  }, [userId, fetchUserJobs]);

  return { userJobs, loadingJobs, fetchUserJobs, setUserJobs };
}

// Hook for fetching and managing user sitemaps
export function useUserSitemaps(userId: string | undefined) {
  const [userSitemaps, setUserSitemaps] = useState<Sitemap[]>([]);
  const [loadingSitemaps, setLoadingSitemaps] = useState(false);

  const fetchUserSitemaps = useCallback(async () => {
    if (!userId) return;
    
    try {
      setLoadingSitemaps(true);
      const { data, error } = await supabase
        .from('sitemaps')
        .select('*')
        .eq('user_id', userId)
        .order('parsed_at', { ascending: false });
        
      if (error) {
        console.error("Error fetching user sitemaps:", error);
        return;
      }
      
      setUserSitemaps(data || []);
    } catch (error) {
      console.error("Error fetching user sitemaps:", error);
    } finally {
      setLoadingSitemaps(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchUserSitemaps();
    }
  }, [userId, fetchUserSitemaps]);

  return { userSitemaps, loadingSitemaps, fetchUserSitemaps };
}

// Hook for managing auto-refresh behavior
export function useAutoRefresh(
  userJobs: SitemapJob[], 
  fetchUserJobs: () => Promise<void>,
  fetchUserSitemaps: () => Promise<void>,
  processingJobId: string | null,
  onJobCompletion: (job: SitemapJob) => void
) {
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    let refreshInterval: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        // Check if there are any jobs that are not completed or failed
        const hasActiveJobs = userJobs.some(job => 
          job.status.toLowerCase() === 'queued' || 
          job.status.toLowerCase() === 'processing'
        );
        
        if (hasActiveJobs) {
          fetchUserJobs();
          fetchUserSitemaps(); // Also refresh sitemaps when there are active jobs
          
          // Check if the current processingJobId is still active
          if (processingJobId) {
            const job = userJobs.find(j => j.id === processingJobId);
            if (job && (job.status.toLowerCase() === 'completed' || job.status.toLowerCase() === 'failed')) {
              // Call the completion handler
              onJobCompletion(job);
            }
          }
        } else {
          // No active jobs, stop auto-refresh
          setAutoRefresh(false);
        }
      }, 5000); // Check every 5 seconds
    }
    
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [autoRefresh, userJobs, processingJobId, fetchUserJobs, fetchUserSitemaps, onJobCompletion]);

  // When a new job is created, enable auto-refresh
  useEffect(() => {
    if (processingJobId) {
      setAutoRefresh(true);
    }
  }, [processingJobId]);

  return { autoRefresh, setAutoRefresh };
}

// Hook for loading sitemap URLs from the database
export function useSitemapUrls() {
  const loadSitemapUrls = async (sitemapUrl: string, status: string = "") => {
    try {
      const { data, error } = await supabase
        .from('sitemap_urls')
        .select('url')
        .eq('sitemap_url', sitemapUrl)
        .limit(200);
        
      if (error) {
        console.error("Error loading URLs for sitemap:", error);
        toast({
          title: "Error",
          description: `Could not load URLs for this sitemap: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }
      
      if (data && data.length > 0) {
        const urls = data.map(item => item.url);
        
        toast({
          title: "URLs Loaded",
          description: `Loaded ${data.length} URLs from ${sitemapUrl}`,
        });
        
        return {
          urls,
          storageStatus: status.toLowerCase() === 'completed' ? "full" as const : "partial" as const
        };
      } else {
        toast({
          title: "No URLs Found",
          description: `No URLs were found for ${sitemapUrl}`,
          variant: "destructive",
        });
        return null;
      }
    } catch (error) {
      console.error("Error loading URLs for sitemap:", error);
      return null;
    }
  };

  return { loadSitemapUrls };
} 