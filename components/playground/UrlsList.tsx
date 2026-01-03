import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StorageStatus } from "@/lib/playground-types"

interface UrlsListProps {
  urls: string[];
  storageStatus: StorageStatus;
}

export function UrlsList({ urls, storageStatus }: UrlsListProps) {
  if (urls.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Found URLs ({urls.length})</CardTitle>
        <CardDescription className="text-xs">
          These URLs were extracted from the sitemap and 
          {storageStatus === "full" ? " stored in the database." : 
           storageStatus === "partial" ? " partially stored in the database." : 
           " not stored in the database."}
          Each domain could potentially have an llms.txt file.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[40vh] overflow-y-auto">
          <ul className="space-y-1 text-sm">
            {urls.map((url, index) => (
              <li key={index} className="break-all">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
} 