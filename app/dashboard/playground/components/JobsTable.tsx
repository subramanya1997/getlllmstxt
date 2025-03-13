import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SitemapJob } from "../types"
import { Loader2, Clock } from "lucide-react"
import { formatDistanceToNow } from 'date-fns'
import { RefreshButton } from "./RefreshButton"
import { StatusBadge } from "./StatusBadge"

interface JobsTableProps {
  jobs: SitemapJob[];
  loading: boolean;
  autoRefresh: boolean;
  onRefreshClick: () => void;
  onJobClick: (job: SitemapJob) => void;
}

export function JobsTable({ 
  jobs, 
  loading, 
  autoRefresh, 
  onRefreshClick, 
  onJobClick 
}: JobsTableProps) {
  // Function to calculate and format progress percentage
  const calculateProgress = (processed: number, total: number) => {
    if (!total) return "0%";
    const percentage = Math.round((processed / total) * 100);
    return `${percentage}%`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Your Processing Jobs</span>
          <div className="flex items-center gap-2">
            {autoRefresh && (
              <span className="text-xs text-green-500 flex items-center">
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Auto-refreshing
              </span>
            )}
            <RefreshButton 
              isLoading={loading}
              isAutoRefresh={autoRefresh}
              onClick={onRefreshClick}
              title={autoRefresh ? "Click to stop auto-refresh" : "Click to enable auto-refresh"}
            />
          </div>
        </CardTitle>
        <CardDescription className="text-xs">
          Track the status of your sitemap processing jobs.
          {autoRefresh && (
            <span className="text-green-500 ml-1">
              Live updates enabled.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-[#E76F51]" />
          </div>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No processing jobs found. Parse a sitemap to create one.
          </p>
        ) : (
          <div className="max-h-[40vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Sitemap</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Progress</th>
                  <th className="text-left py-2 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => {
                  // Extract just the domain name for display
                  let displayUrl = job.sitemap_url;
                  try {
                    const urlObj = new URL(job.sitemap_url);
                    displayUrl = urlObj.hostname;
                  } catch {
                    console.error("Invalid URL:", job.sitemap_url);
                  }
                  
                  return (
                    <tr 
                      key={job.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer" 
                      onClick={() => onJobClick(job)}
                      title="Click to view URLs for this job"
                    >
                      <td className="py-2 truncate max-w-[150px]" title={job.sitemap_url}>
                        {displayUrl}
                      </td>
                      <td className="py-2"><StatusBadge status={job.status} /></td>
                      <td className="py-2">
                        {job.processed_urls !== null && job.total_urls ? 
                          `${job.processed_urls}/${job.total_urls} (${calculateProgress(job.processed_urls, job.total_urls)})` : 
                          "N/A"}
                      </td>
                      <td className="py-2 flex items-center">
                        <Clock className="h-3 w-3 inline mr-1 text-gray-400" />
                        <span title={new Date(job.created_at).toLocaleString()}>
                          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                        </span>
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