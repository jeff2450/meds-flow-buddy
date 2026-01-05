// Offline authentication using IndexedDB for secure credential caching
// Uses PBKDF2 for password hashing (secure, browser-native)

const DB_NAME = 'pharm_offline_auth';
const DB_VERSION = 1;
const STORE_NAME = 'cached_credentials';

interface CachedCredential {
  email: string;
  passwordHash: string;
  salt: string;
  userId: string;
  fullName: string | null;
  roles: string[];
  cachedAt: number;
}

// Open IndexedDB connection
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'email' });
      }
    };
  });
}

// Generate cryptographically secure salt
function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Hash password using PBKDF2 (browser-native, secure)
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  return Array.from(new Uint8Array(derivedBits), byte => 
    byte.toString(16).padStart(2, '0')
  ).join('');
}

// Cache credentials after successful online login
export async function cacheCredentials(
  email: string,
  password: string,
  userId: string,
  fullName: string | null,
  roles: string[]
): Promise<void> {
  try {
    const db = await openDB();
    const salt = generateSalt();
    const passwordHash = await hashPassword(password, salt);
    
    const credential: CachedCredential = {
      email: email.toLowerCase(),
      passwordHash,
      salt,
      userId,
      fullName,
      roles,
      cachedAt: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(credential);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to cache credentials:', error);
  }
}

// Verify offline credentials
export async function verifyOfflineCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; user?: CachedCredential }> {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(email.toLowerCase());
      
      request.onsuccess = async () => {
        const credential = request.result as CachedCredential | undefined;
        
        if (!credential) {
          resolve({ success: false });
          return;
        }
        
        // Check if credentials are not too old (30 days max)
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
        if (Date.now() - credential.cachedAt > maxAge) {
          resolve({ success: false });
          return;
        }
        
        const hashedInput = await hashPassword(password, credential.salt);
        
        if (hashedInput === credential.passwordHash) {
          resolve({ success: true, user: credential });
        } else {
          resolve({ success: false });
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to verify offline credentials:', error);
    return { success: false };
  }
}

// Check if user has cached credentials
export async function hasCachedCredentials(email: string): Promise<boolean> {
  try {
    const db = await openDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(email.toLowerCase());
      
      request.onsuccess = () => {
        resolve(!!request.result);
      };
      
      request.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

// Get cached user for session restoration
export async function getCachedUser(email: string): Promise<CachedCredential | null> {
  try {
    const db = await openDB();
    
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(email.toLowerCase());
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

// Clear cached credentials for a user
export async function clearCachedCredentials(email: string): Promise<void> {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(email.toLowerCase());
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to clear cached credentials:', error);
  }
}

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Store offline session in localStorage
export function setOfflineSession(user: CachedCredential): void {
  localStorage.setItem('offline_session', JSON.stringify({
    userId: user.userId,
    email: user.email,
    fullName: user.fullName,
    roles: user.roles,
    isOffline: true,
    createdAt: Date.now()
  }));
}

// Get offline session
export function getOfflineSession(): {
  userId: string;
  email: string;
  fullName: string | null;
  roles: string[];
  isOffline: boolean;
} | null {
  const session = localStorage.getItem('offline_session');
  if (!session) return null;
  
  try {
    return JSON.parse(session);
  } catch {
    return null;
  }
}

// Clear offline session
export function clearOfflineSession(): void {
  localStorage.removeItem('offline_session');
}
