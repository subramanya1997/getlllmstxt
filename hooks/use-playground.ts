import { useState, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { Sitemap } from "@/lib/playground-types";
import { supabaseClient } from "@/lib/supabase-client";

// Use the pre-initialized Supabase client
const supabase = supabaseClient;

// Hook for fetching and managing user sitemaps
export function useUserSitemaps(userId: string | undefined) {
  const [userSitemaps, setUserSitemaps] = useState<Sitemap[]>([]);
  const [loadingSitemaps, setLoadingSitemaps] = useState(false);

  const fetchUserSitemaps = useCallback(async () => {
    if (!userId) {
      setUserSitemaps([]);
      return;
    }
    
    try {
      setLoadingSitemaps(true);
      const { data, error } = await supabase
        .from('sitemaps')
        .select('*')
        .eq('user_id', userId)
        .order('parsed_at', { ascending: false });
        
      if (error) {
        // Only log meaningful errors, ignore empty error objects
        if (error.message) {
          console.error("Error fetching user sitemaps:", error.message);
        }
        setUserSitemaps([]);
        return;
      }
      
      setUserSitemaps(data || []);
    } catch (error) {
      // Only log actual errors with messages
      if (error instanceof Error && error.message) {
        console.error("Error fetching user sitemaps:", error.message);
      }
      setUserSitemaps([]);
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
        if (error.message) {
          console.error("Error loading URLs for sitemap:", error.message);
          toast({
            title: "Error",
            description: `Could not load URLs for this sitemap: ${error.message}`,
            variant: "destructive",
          });
        }
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
