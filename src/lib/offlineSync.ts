// Offline data sync queue using IndexedDB
// Queues operations when offline and syncs when back online

import { supabase } from "@/integrations/supabase/client";

const DB_NAME = 'pharm_offline_sync';
const DB_VERSION = 1;
const QUEUE_STORE = 'pending_operations';
const CACHE_STORE = 'cached_data';

export type OperationType = 'sale' | 'transaction' | 'medicine' | 'adjustment';

export interface PendingOperation {
  id: string;
  type: OperationType;
  table: string;
  action: 'insert' | 'update' | 'delete';
  data: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
}

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
      
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      }
    };
  });
}

// Generate unique ID for operations
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Add operation to queue
export async function queueOperation(
  type: OperationType,
  table: string,
  action: 'insert' | 'update' | 'delete',
  data: Record<string, unknown>
): Promise<string> {
  const db = await openDB();
  const id = generateId();
  
  const operation: PendingOperation = {
    id,
    type,
    table,
    action,
    data,
    createdAt: Date.now(),
    retryCount: 0
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.add(operation);
    
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

// Get all pending operations
export async function getPendingOperations(): Promise<PendingOperation[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);
    const index = store.index('createdAt');
    const request = index.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get pending operations count
export async function getPendingCount(): Promise<number> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readonly');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.count();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Remove operation from queue
export async function removeOperation(id: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Update operation retry count
export async function updateRetryCount(id: string, count: number): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const operation = getRequest.result;
      if (operation) {
        operation.retryCount = count;
        const putRequest = store.put(operation);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// Cache data locally
export async function cacheData(key: string, data: unknown): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([CACHE_STORE], 'readwrite');
    const store = transaction.objectStore(CACHE_STORE);
    const request = store.put({ key, data, cachedAt: Date.now() });
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get cached data
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction([CACHE_STORE], 'readonly');
      const store = transaction.objectStore(CACHE_STORE);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          // Check if cache is not older than 24 hours
          const maxAge = 24 * 60 * 60 * 1000;
          if (Date.now() - result.cachedAt < maxAge) {
            resolve(result.data as T);
            return;
          }
        }
        resolve(null);
      };
      
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Sync single operation based on table type
async function syncOperation(operation: PendingOperation): Promise<boolean> {
  try {
    let error = null;
    
    if (operation.action === 'insert') {
      switch (operation.table) {
        case 'medicine_sales': {
          const result = await supabase.from('medicine_sales').insert({
            medicine_id: operation.data.medicine_id as string,
            sale_date: operation.data.sale_date as string,
            quantity_sold: operation.data.quantity_sold as number,
            unit_price: operation.data.unit_price as number,
            notes: operation.data.notes as string | null,
            is_prescription: operation.data.is_prescription as boolean | null,
          });
          error = result.error;
          break;
        }
        case 'medicines': {
          const result = await supabase.from('medicines').insert({
            name: operation.data.name as string,
            category_id: operation.data.category_id as string | null,
            current_stock: operation.data.current_stock as number,
            total_stock: operation.data.total_stock as number,
            min_stock_level: operation.data.min_stock_level as number,
            entry_date: operation.data.entry_date as string | null,
            cost_price: operation.data.cost_price as number | null,
            medicine_type: operation.data.medicine_type as 'prescription' | 'otc' | 'controlled' | 'medical_supplies' | null,
          });
          error = result.error;
          break;
        }
        case 'stock_adjustments': {
          const result = await supabase.from('stock_adjustments').insert({
            medicine_id: operation.data.medicine_id as string,
            quantity: operation.data.quantity as number,
            adjustment_type: operation.data.adjustment_type as string,
            notes: operation.data.notes as string | null,
            value: operation.data.value as number | null,
          });
          error = result.error;
          break;
        }
        default:
          console.error(`Unknown table: ${operation.table}`);
          return false;
      }
    }
    
    if (error) {
      console.error(`Sync error for operation ${operation.id}:`, error);
      return false;
    }
    
    return true;
  } catch (err) {
    console.error(`Sync exception for operation ${operation.id}:`, err);
    return false;
  }
}

// Sync all pending operations
export async function syncPendingOperations(): Promise<{
  synced: number;
  failed: number;
  remaining: number;
}> {
  const operations = await getPendingOperations();
  let synced = 0;
  let failed = 0;
  
  for (const operation of operations) {
    const success = await syncOperation(operation);
    
    if (success) {
      await removeOperation(operation.id);
      synced++;
    } else {
      // Increment retry count
      const newRetryCount = operation.retryCount + 1;
      
      if (newRetryCount >= 5) {
        // Remove after 5 failed attempts
        await removeOperation(operation.id);
        failed++;
        console.error(`Operation ${operation.id} failed after 5 retries, removed`);
      } else {
        await updateRetryCount(operation.id, newRetryCount);
      }
    }
  }
  
  const remaining = await getPendingCount();
  
  return { synced, failed, remaining };
}

// Clear all pending operations
export async function clearPendingOperations(): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([QUEUE_STORE], 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
