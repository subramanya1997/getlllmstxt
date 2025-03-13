import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sitemap } from "../types"
import { Loader2, Globe } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { RefreshButton } from "./RefreshButton"
import { StatusBadge } from "./StatusBadge"

interface SitemapsTableProps {
  sitemaps: Sitemap[];
  loading: boolean;
  onRefreshClick: () => void;
  onSitemapClick: (sitemap: Sitemap) => void;
}

export function SitemapsTable({ 
  sitemaps, 
  loading, 
  onRefreshClick, 
  onSitemapClick 
}: SitemapsTableProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Your Parsed Sitemaps</span>
          <RefreshButton 
            isLoading={loading}
            onClick={onRefreshClick}
            title="Refresh sitemaps list"
          />
        </CardTitle>
        <CardDescription className="text-xs">
          Sitemaps you&apos;ve previously parsed. Click on a sitemap to view its URLs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-[#E76F51]" />
          </div>
        ) : sitemaps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No parsed sitemaps found. Parse a sitemap to add one.
          </p>
        ) : (
          <div className="max-h-[40vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Domain</th>
                  <th className="text-left py-2 font-medium">URL Count</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Last Parsed</th>
                </tr>
              </thead>
              <tbody>
                {sitemaps.map((sitemap) => {
                  return (
                    <tr 
                      key={sitemap.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer" 
                      onClick={() => onSitemapClick(sitemap)}
                      title="Click to view URLs for this sitemap"
                    >
                      <td className="py-2 flex items-center">
                        <Globe className="h-3 w-3 inline mr-1 text-gray-400" />
                        <span className="truncate max-w-[150px]" title={sitemap.domain}>
                          {sitemap.domain}
                        </span>
                      </td>
                      <td className="py-2">{sitemap.url_count}</td>
                      <td className="py-2"><StatusBadge status={sitemap.status} /></td>
                      <td className="py-2" title={new Date(sitemap.parsed_at).toLocaleString()}>
                        {formatDistanceToNow(new Date(sitemap.parsed_at), { addSuffix: true })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 