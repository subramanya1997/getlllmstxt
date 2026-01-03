"use client"

import { useState } from "react"
import { toast } from "sonner"
import { SitemapForm } from "@/components/playground/SitemapForm"
import { SitemapsTable } from "@/components/playground/SitemapsTable"
import { UrlsList } from "@/components/playground/UrlsList"
import { useUserSitemaps, useSitemapUrls } from "@/hooks/use-playground"
import { parseLocalSitemap, storeInSupabase } from "@/lib/playground-utils"
import { Sitemap, StorageStatus } from "@/lib/playground-types"
import { useUser } from "@/lib/user-provider"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

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
  
  const { session } = userHook()
  const userId = session?.user?.id
  
  // Custom hooks
  const { userSitemaps, loadingSitemaps, fetchUserSitemaps } = useUserSitemaps(userId);
  const { loadSitemapUrls } = useSitemapUrls();
  
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
      toast.error("Error", {
        description: "Please enter a sitemap URL",
      })
      return
    }

    setLoading(true)
    setUrls([])
    setStorageStatus("none")

    try {
      // Parse sitemap locally
      const extractedUrls = await parseLocalSitemap(sitemapUrl);
      let storedCount = 0;
      
      // If we're authenticated, store the URLs in Supabase
      if (session && userId) {
        storedCount = await storeInSupabase(sitemapUrl, extractedUrls, userId);
        
        // Refresh the sitemaps list to show the new data
        fetchUserSitemaps();
      }
      
      // Update state with extracted URLs
      setUrls(extractedUrls);
      
      // Update storage status
      if (storedCount === 0) {
        setStorageStatus("none");
      } else if (storedCount > 0 && storedCount < extractedUrls.length) {
        setStorageStatus("partial");
      } else if (storedCount >= extractedUrls.length) {
        setStorageStatus("full");
      }
      
      if (extractedUrls.length === 0) {
        toast.error("No URLs found", {
          description: "The sitemap didn't contain any valid URLs",
        });
      } else {
        toast.success("Success", {
          description: `Found ${extractedUrls.length} URLs from the sitemap${
            storedCount > 0 ? ` (${storedCount} stored)` : ''
          }`,
        });
      }
    } catch (error) {
      console.error("Error parsing sitemap:", error);
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to parse sitemap",
      });
      setStorageStatus("none");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <p className="text-sm text-muted-foreground">Discover and analyze website llms.txt files</p>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <SitemapForm 
          onSubmit={handleSubmit}
          loading={loading}
          storageStatus={storageStatus}
          isAuthenticated={!!session}
        />
        
        {session && (
          <SitemapsTable 
            sitemaps={userSitemaps}
            loading={loadingSitemaps}
            onRefreshClick={fetchUserSitemaps}
            onSitemapClick={handleSitemapClick}
          />
        )}
        
        <UrlsList urls={urls} storageStatus={storageStatus} />
      </div>
    </>
  )
}
