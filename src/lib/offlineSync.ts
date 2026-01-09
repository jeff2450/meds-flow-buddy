// Offline data sync queue using IndexedDB
// Queues operations when offline and syncs when back online
// Also stores local copies of sales and stock data for offline access

import { supabase } from "@/integrations/supabase/client";

const DB_NAME = 'pharm_offline_sync';
const DB_VERSION = 2; // Upgraded to add new stores
const QUEUE_STORE = 'pending_operations';
const CACHE_STORE = 'cached_data';
const SALES_STORE = 'offline_sales';
const MEDICINES_STORE = 'offline_medicines';
const STOCK_STORE = 'offline_stock_transactions';

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

// Interfaces for offline data
export interface OfflineSale {
  id: string;
  medicine_id: string;
  medicine_name?: string;
  sale_date: string;
  quantity_sold: number;
  unit_price: number;
  total_amount: number;
  notes?: string;
  is_prescription?: boolean;
  created_at: number;
  synced: boolean;
}

export interface OfflineMedicine {
  id: string;
  name: string;
  category_id?: string;
  category_name?: string;
  current_stock: number;
  total_stock: number;
  min_stock_level: number;
  cost_price?: number;
  medicine_type?: string;
  entry_date?: string;
  updated_at: number;
}

export interface OfflineStockTransaction {
  id: string;
  medicine_id: string;
  medicine_name?: string;
  quantity: number;
  transaction_type: string;
  transaction_date: string;
  notes?: string;
  created_at: number;
  synced: boolean;
}

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Pending operations store
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        const store = db.createObjectStore(QUEUE_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('type', 'type', { unique: false });
      }
      
      // Cache store
      if (!db.objectStoreNames.contains(CACHE_STORE)) {
        db.createObjectStore(CACHE_STORE, { keyPath: 'key' });
      }
      
      // Offline sales store
      if (!db.objectStoreNames.contains(SALES_STORE)) {
        const salesStore = db.createObjectStore(SALES_STORE, { keyPath: 'id' });
        salesStore.createIndex('sale_date', 'sale_date', { unique: false });
        salesStore.createIndex('synced', 'synced', { unique: false });
        salesStore.createIndex('medicine_id', 'medicine_id', { unique: false });
      }
      
      // Offline medicines store
      if (!db.objectStoreNames.contains(MEDICINES_STORE)) {
        const medicinesStore = db.createObjectStore(MEDICINES_STORE, { keyPath: 'id' });
        medicinesStore.createIndex('name', 'name', { unique: false });
        medicinesStore.createIndex('category_id', 'category_id', { unique: false });
      }
      
      // Offline stock transactions store
      if (!db.objectStoreNames.contains(STOCK_STORE)) {
        const stockStore = db.createObjectStore(STOCK_STORE, { keyPath: 'id' });
        stockStore.createIndex('transaction_date', 'transaction_date', { unique: false });
        stockStore.createIndex('synced', 'synced', { unique: false });
        stockStore.createIndex('medicine_id', 'medicine_id', { unique: false });
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

// ==================== OFFLINE SALES OPERATIONS ====================

// Save a sale to offline storage
export async function saveOfflineSale(sale: OfflineSale): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SALES_STORE], 'readwrite');
    const store = transaction.objectStore(SALES_STORE);
    const request = store.put(sale);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get all offline sales
export async function getOfflineSales(): Promise<OfflineSale[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SALES_STORE], 'readonly');
    const store = transaction.objectStore(SALES_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get offline sales by date
export async function getOfflineSalesByDate(date: string): Promise<OfflineSale[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SALES_STORE], 'readonly');
    const store = transaction.objectStore(SALES_STORE);
    const index = store.index('sale_date');
    const request = index.getAll(date);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Delete offline sale
export async function deleteOfflineSale(id: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SALES_STORE], 'readwrite');
    const store = transaction.objectStore(SALES_STORE);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Mark sale as synced
export async function markSaleSynced(id: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SALES_STORE], 'readwrite');
    const store = transaction.objectStore(SALES_STORE);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const sale = getRequest.result;
      if (sale) {
        sale.synced = true;
        const putRequest = store.put(sale);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// ==================== OFFLINE MEDICINES OPERATIONS ====================

// Save medicine to offline storage
export async function saveOfflineMedicine(medicine: OfflineMedicine): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDICINES_STORE], 'readwrite');
    const store = transaction.objectStore(MEDICINES_STORE);
    const request = store.put(medicine);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Save multiple medicines to offline storage (for bulk sync)
export async function saveOfflineMedicines(medicines: OfflineMedicine[]): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDICINES_STORE], 'readwrite');
    const store = transaction.objectStore(MEDICINES_STORE);
    
    let completed = 0;
    const total = medicines.length;
    
    if (total === 0) {
      resolve();
      return;
    }
    
    medicines.forEach((medicine) => {
      const request = store.put(medicine);
      request.onsuccess = () => {
        completed++;
        if (completed === total) resolve();
      };
      request.onerror = () => reject(request.error);
    });
  });
}

// Get all offline medicines
export async function getOfflineMedicines(): Promise<OfflineMedicine[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDICINES_STORE], 'readonly');
    const store = transaction.objectStore(MEDICINES_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Get offline medicine by ID
export async function getOfflineMedicine(id: string): Promise<OfflineMedicine | null> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDICINES_STORE], 'readonly');
    const store = transaction.objectStore(MEDICINES_STORE);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Update offline medicine stock (for local stock adjustments)
export async function updateOfflineMedicineStock(id: string, quantityChange: number): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([MEDICINES_STORE], 'readwrite');
    const store = transaction.objectStore(MEDICINES_STORE);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const medicine = getRequest.result;
      if (medicine) {
        medicine.current_stock = Math.max(0, medicine.current_stock + quantityChange);
        medicine.updated_at = Date.now();
        const putRequest = store.put(medicine);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// ==================== OFFLINE STOCK TRANSACTIONS ====================

// Save stock transaction to offline storage
export async function saveOfflineStockTransaction(transaction: OfflineStockTransaction): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STOCK_STORE], 'readwrite');
    const store = tx.objectStore(STOCK_STORE);
    const request = store.put(transaction);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Get all offline stock transactions
export async function getOfflineStockTransactions(): Promise<OfflineStockTransaction[]> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STOCK_STORE], 'readonly');
    const store = transaction.objectStore(STOCK_STORE);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Mark stock transaction as synced
export async function markStockTransactionSynced(id: string): Promise<void> {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STOCK_STORE], 'readwrite');
    const store = transaction.objectStore(STOCK_STORE);
    const getRequest = store.get(id);
    
    getRequest.onsuccess = () => {
      const tx = getRequest.result;
      if (tx) {
        tx.synced = true;
        const putRequest = store.put(tx);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };
    
    getRequest.onerror = () => reject(getRequest.error);
  });
}

// ==================== DATA SYNC HELPERS ====================

// Sync medicines from server to offline storage
export async function syncMedicinesToOffline(): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('medicines')
      .select('*, medicine_categories(name)')
      .order('name');
    
    if (error) throw error;
    
    if (data) {
      const offlineMedicines: OfflineMedicine[] = data.map((m) => ({
        id: m.id,
        name: m.name,
        category_id: m.category_id || undefined,
        category_name: m.medicine_categories?.name || undefined,
        current_stock: m.current_stock,
        total_stock: m.total_stock,
        min_stock_level: m.min_stock_level,
        cost_price: m.cost_price || undefined,
        medicine_type: m.medicine_type || undefined,
        entry_date: m.entry_date || undefined,
        updated_at: Date.now(),
      }));
      
      await saveOfflineMedicines(offlineMedicines);
    }
  } catch (error) {
    console.error('Failed to sync medicines to offline storage:', error);
  }
}

// Get unsynced sales count
export async function getUnsyncedSalesCount(): Promise<number> {
  const sales = await getOfflineSales();
  return sales.filter(s => !s.synced).length;
}

// Get unsynced stock transactions count
export async function getUnsyncedStockCount(): Promise<number> {
  const transactions = await getOfflineStockTransactions();
  return transactions.filter(t => !t.synced).length;
}
