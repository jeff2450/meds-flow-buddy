import { RefreshCw, Cloud, CloudOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useOfflineSync } from "@/hooks/useOfflineSync";

export function SyncStatus() {
  const { online, pendingCount, syncing, sync } = useOfflineSync();

  if (online && pendingCount === 0) {
    return (
      <Badge variant="outline" className="flex items-center gap-1.5 text-green-600 border-green-300">
        <Cloud className="h-3 w-3" />
        Synced
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {pendingCount > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="secondary" 
              className="flex items-center gap-1.5 text-amber-600 bg-amber-50 dark:bg-amber-950/30"
            >
              <CloudOff className="h-3 w-3" />
              {pendingCount} pending
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{pendingCount} operation{pendingCount > 1 ? 's' : ''} waiting to sync</p>
          </TooltipContent>
        </Tooltip>
      )}
      
      {online && pendingCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={sync}
          disabled={syncing}
          className="h-7 px-2"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span className="ml-1 text-xs">
            {syncing ? 'Syncing...' : 'Sync now'}
          </span>
        </Button>
      )}
    </div>
  );
}
