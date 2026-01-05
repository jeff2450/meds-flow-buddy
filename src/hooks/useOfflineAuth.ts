import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  cacheCredentials, 
  verifyOfflineCredentials, 
  isOnline, 
  setOfflineSession, 
  getOfflineSession, 
  clearOfflineSession 
} from '@/lib/offlineAuth';
import type { User, Session } from '@supabase/supabase-js';

interface OfflineUser {
  id: string;
  email: string;
  fullName: string | null;
  roles: string[];
  isOffline: boolean;
}

export function useOfflineAuth() {
  const [user, setUser] = useState<User | OfflineUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(isOnline());
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // Handle online/offline status changes
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // If we have an offline session and we're back online, try to re-authenticate
      const offlineSession = getOfflineSession();
      if (offlineSession) {
        clearOfflineSession();
        setIsOfflineMode(false);
      }
    };
    
    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      // First check for Supabase session
      const { data: { session: supaSession } } = await supabase.auth.getSession();
      
      if (supaSession) {
        setSession(supaSession);
        setUser(supaSession.user);
        setIsOfflineMode(false);
        setLoading(false);
        return;
      }

      // If offline and no Supabase session, check for offline session
      if (!isOnline()) {
        const offlineSession = getOfflineSession();
        if (offlineSession) {
          setUser({
            id: offlineSession.userId,
            email: offlineSession.email,
            fullName: offlineSession.fullName,
            roles: offlineSession.roles,
            isOffline: true
          });
          setIsOfflineMode(true);
        }
      }
      
      setLoading(false);
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        setIsOfflineMode(false);
        clearOfflineSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Login function that supports both online and offline
  const login = useCallback(async (email: string, password: string): Promise<{ 
    success: boolean; 
    error?: string;
    isOffline?: boolean;
  }> => {
    if (isOnline()) {
      // Online login via Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        // Fetch user roles for caching
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id);

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', data.user.id)
          .single();

        // Cache credentials for offline use
        await cacheCredentials(
          email,
          password,
          data.user.id,
          profile?.full_name || null,
          roles?.map(r => r.role) || []
        );
      }

      return { success: true, isOffline: false };
    } else {
      // Offline login using cached credentials
      const result = await verifyOfflineCredentials(email, password);
      
      if (result.success && result.user) {
        setOfflineSession(result.user);
        setUser({
          id: result.user.userId,
          email: result.user.email,
          fullName: result.user.fullName,
          roles: result.user.roles,
          isOffline: true
        });
        setIsOfflineMode(true);
        return { success: true, isOffline: true };
      }
      
      return { 
        success: false, 
        error: 'No cached credentials found. Please login online first.' 
      };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    if (isOnline()) {
      await supabase.auth.signOut();
    }
    clearOfflineSession();
    setUser(null);
    setSession(null);
    setIsOfflineMode(false);
  }, []);

  return {
    user,
    session,
    loading,
    online,
    isOfflineMode,
    login,
    logout
  };
}
