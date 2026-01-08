import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  syncPendingOperations, 
  getPendingCount, 
  queueOperation,
  type OperationType 
} from '@/lib/offlineSync';
import { isOnline } from '@/lib/offlineAuth';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

export function useOfflineSync() {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const syncInProgress = useRef(false);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  // Sync pending operations
  const sync = useCallback(async () => {
    if (syncInProgress.current || !navigator.onLine) return;
    
    syncInProgress.current = true;
    setSyncing(true);
    
    try {
      const result = await syncPendingOperations();
      
      if (result.synced > 0) {
        toast({
          title: "Data synced",
          description: `Successfully synced ${result.synced} offline operation${result.synced > 1 ? 's' : ''}.`,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ["medicines"] });
        queryClient.invalidateQueries({ queryKey: ["medicine-sales"] });
        queryClient.invalidateQueries({ queryKey: ["medicines-with-categories"] });
      }
      
      if (result.failed > 0) {
        toast({
          variant: "destructive",
          title: "Sync errors",
          description: `${result.failed} operation${result.failed > 1 ? 's' : ''} failed to sync after multiple retries.`,
        });
      }
      
      await updatePendingCount();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
      syncInProgress.current = false;
    }
  }, [toast, queryClient, updatePendingCount]);

  // Queue a new operation and trigger background sync if online
  const queue = useCallback(async (
    type: OperationType,
    table: string,
    action: 'insert' | 'update' | 'delete',
    data: Record<string, unknown>
  ) => {
    await queueOperation(type, table, action, data);
    await updatePendingCount();
    
    // Trigger background sync immediately if online (don't wait)
    if (navigator.onLine) {
      // Use setTimeout to not block the UI
      setTimeout(() => sync(), 0);
    }
  }, [updatePendingCount, sync]);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Auto-sync when coming back online
      sync();
    };
    
    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial pending count
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [sync, updatePendingCount]);

  // Periodic sync check when online (every 10 seconds for faster sync)
  useEffect(() => {
    if (!online) return;
    
    const interval = setInterval(() => {
      if (pendingCount > 0 && !syncing) {
        sync();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [online, pendingCount, syncing, sync]);

  // Sync when tab becomes visible (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine && pendingCount > 0) {
        sync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pendingCount, sync]);

  return {
    online,
    pendingCount,
    syncing,
    sync,
    queue,
    updatePendingCount
  };
}
