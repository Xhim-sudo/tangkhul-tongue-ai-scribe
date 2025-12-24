
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  staff_id: string | null;
  role: 'admin' | 'expert' | 'reviewer' | 'contributor';
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata?: any) => Promise<void>;
  signOut: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  session: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  hasRole: () => false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserProfileWithTimeout(session.user.id);
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setUserProfile(null);
          setUserRoles([]);
          setLoading(false);
        }
      }
    );

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setLoading(false);
          return;
        }
        
        if (!session) {
          setLoading(false);
        }
      } catch (error) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        return;
      }

      if (data && data.length > 0) {
        setUserRoles(data.map(r => r.role));
      }
    } catch (error) {
      // Silent fail
    }
  };

  const fetchUserProfileWithTimeout = async (userId: string) => {
    const timeoutMs = 5000;
    
    const fetchPromise = fetchUserProfile(userId);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile fetch timeout')), timeoutMs)
    );

    try {
      await Promise.race([fetchPromise, timeoutPromise]);
    } catch (error) {
      // Silent fail - timeout or error
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          await createUserProfile(userId);
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          
          if (retryError) {
            return;
          }
          
          if (retryData) {
            setUserProfile(retryData);
          }
        }
        return;
      }

      if (data) {
        setUserProfile(data);
      } else {
        await createUserProfile(userId);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        return;
      }

      const profileData = {
        id: userId,
        email: authUser.user.email || '',
        full_name: authUser.user.user_metadata?.full_name || authUser.user.email,
        phone_number: authUser.user.user_metadata?.phone_number || null,
        staff_id: authUser.user.user_metadata?.staff_id || null,
        role: 'contributor' as const
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    } catch (error) {
      // Silent fail
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: metadata?.full_name,
          phone_number: metadata?.phone_number,
          staff_id: metadata?.staff_id,
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUserRoles([]);
  };

  const hasRole = (role: string): boolean => {
    if (userRoles.includes(role)) {
      return true;
    }
    if (userRoles.includes('admin')) {
      return true;
    }
    if (userProfile?.role === role) {
      return true;
    }
    if (userProfile?.role === 'admin') {
      return true;
    }
    return false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      session,
      loading,
      signIn,
      signUp,
      signOut,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
