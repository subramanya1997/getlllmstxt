import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Search, Database } from "lucide-react"
import { StorageStatus } from "@/lib/playground-types"

interface SitemapFormProps {
  onSubmit: (sitemapUrl: string) => Promise<void>;
  loading: boolean;
  storageStatus: StorageStatus;
  isAuthenticated: boolean;
}

export function SitemapForm({ 
  onSubmit, 
  loading, 
  storageStatus, 
  isAuthenticated
}: SitemapFormProps) {
  const [sitemapUrl, setSitemapUrl] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sitemapUrl) {
      await onSubmit(sitemapUrl)
    }
  }

  return (
    <Card className="border border-[#E76F51]/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <span>Parse Sitemap</span>
          {storageStatus === "full" && (
            <Database className="h-3 w-3 text-green-500" aria-label="All URLs stored in database" />
          )}
          {storageStatus === "partial" && (
            <Database className="h-3 w-3 text-amber-500" aria-label="Some URLs stored in database" />
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          Enter a sitemap URL to extract website URLs for llms.txt analysis.
          {!isAuthenticated && (
            <span className="text-amber-500 block mt-1">
              ⚠️ Sign in to store results in the database. For now, parsing will work but results won&apos;t be saved.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative flex items-center">
            <div className="absolute left-3 text-muted-foreground">
              <Search className="h-4 w-4" />
            </div>
            <Input
              type="url"
              placeholder="https://example.com/sitemap.xml"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              className="pl-9 focus-visible:ring-[#E76F51]"
              disabled={loading}
            />
            <Button 
              type="submit" 
              disabled={loading}
              className="absolute right-1 h-8 px-3 bg-[#E76F51] hover:bg-[#D65F41] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  <span className="text-xs">Processing</span>
                </>
              ) : (
                <span className="text-xs">Parse Sitemap</span>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 