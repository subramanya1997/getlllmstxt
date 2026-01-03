import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"

interface RefreshButtonProps {
  isLoading: boolean;
  isAutoRefresh?: boolean;
  onClick: () => void;
  title?: string;
}

export function RefreshButton({ 
  isLoading, 
  isAutoRefresh = false, 
  onClick, 
  title = "Refresh" 
}: RefreshButtonProps) {
  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick}
      disabled={isLoading}
      className="h-8 px-2"
      title={title}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <RefreshCw className={`h-4 w-4 ${isAutoRefresh ? "text-green-500" : ""}`} />
      )}
    </Button>
  );
} 