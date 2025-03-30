
import { useEffect, useState, createContext, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Update this variable to limit the frequency of status updates
const ONLINE_STATUS_UPDATE_INTERVAL = 10000; // 10 seconds

// Get the URL from the environment or fallback to the project ID
const SUPABASE_URL = "https://ydptpwxhyhiuqrrzztrz.supabase.co";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastStatusUpdate, setLastStatusUpdate] = useState(0);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Update user's online status
        if (session?.user) {
          setTimeout(() => {
            updateUserOnlineStatus(session.user.id, true);
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      // Update user's online status
      if (session?.user) {
        updateUserOnlineStatus(session.user.id, true);
      }
    });

    // Handle window unload to update offline status
    const handleUnload = () => {
      if (user) {
        // Use navigator.sendBeacon for more reliable offline status updates
        try {
          const offlineData = {
            is_online: false,
            last_active: new Date().toISOString()
          };
          
          // Use a direct approach with the known URL instead of accessing protected properties
          const apiUrl = `${SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}`;
          
          // Use the fetch API directly through sendBeacon
          navigator.sendBeacon(
            apiUrl,
            new Blob([JSON.stringify(offlineData)], {
              type: 'application/json'
            })
          );
        } catch (err) {
          console.error('Failed to send offline status via beacon:', err);
        }
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
      
      // Set user offline when component unmounts
      if (user) {
        updateUserOnlineStatus(user.id, false);
      }
    };
  }, [user]);

  const updateUserOnlineStatus = async (userId: string, isOnline: boolean) => {
    const now = Date.now();
    
    // Throttle updates to prevent excessive API calls
    if (now - lastStatusUpdate < ONLINE_STATUS_UPDATE_INTERVAL && isOnline) {
      return;
    }
    
    setLastStatusUpdate(now);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_online: isOnline,
          last_active: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (error) {
        console.error('Error updating online status:', error);
      }
    } catch (err) {
      console.error('Failed to update user online status:', err);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        throw error;
      }
      toast.success('Signed in successfully');
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        toast.error(error.message);
        throw error;
      }
      toast.success('Signed up successfully! Please check your email for verification.');
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Update user status to offline before signing out
      if (user) {
        await updateUserOnlineStatus(user.id, false);
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
        throw error;
      }
      toast.success('Signed out successfully');
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const value = {
    session,
    user,
    signIn,
    signUp,
    signOut,
    loading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
