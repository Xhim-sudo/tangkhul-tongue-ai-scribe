
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
    console.log('🔧 AuthProvider: Setting up auth state management');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔔 Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        // Handle profile fetching separately with timeout
        if (session?.user) {
          console.log('👤 User authenticated, fetching profile...');
          setTimeout(() => {
            fetchUserProfileWithTimeout(session.user.id);
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          console.log('👋 User signed out, clearing profile');
          setUserProfile(null);
          setUserRoles([]);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('🚀 Checking for existing session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('📝 Initial session:', session?.user?.id || 'No session');
        
        if (!session) {
          setLoading(false);
        }
      } catch (error) {
        console.error('💥 Error in initializeAuth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      console.log('🧹 Cleaning up auth subscription');
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
        console.error('Failed to fetch user roles:', error);
        return;
      }

      if (data && data.length > 0) {
        console.log('✅ User roles found:', data.map(r => r.role));
        setUserRoles(data.map(r => r.role));
      }
    } catch (error) {
      console.error('Failed to fetch user roles:', error);
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
      console.error('⏰ Profile fetch failed or timed out:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('🔍 Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error fetching user profile:', error);
        
        if (error.code === 'PGRST116') {
          console.log('📝 Profile not found, attempting to create...');
          await createUserProfile(userId);
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          
          if (retryError) {
            console.error('❌ Retry failed:', retryError);
            return;
          }
          
          if (retryData) {
            console.log('✅ Profile created and fetched:', retryData);
            setUserProfile(retryData);
          }
        }
        return;
      }

      if (data) {
        console.log('✅ Profile found:', data);
        setUserProfile(data);
      } else {
        console.log('🤷 No profile found, attempting to create...');
        await createUserProfile(userId);
      }
    } catch (error) {
      console.error('💥 Error in fetchUserProfile:', error);
    }
  };

  const createUserProfile = async (userId: string) => {
    try {
      const { data: authUser } = await supabase.auth.getUser();
      if (!authUser.user) {
        console.error('❌ No auth user found for profile creation');
        return;
      }

      console.log('🆕 Creating profile for user:', userId);
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

      if (error) {
        console.error('❌ Error creating user profile:', error);
      } else {
        console.log('✅ Profile created successfully:', data);
        setUserProfile(data);
      }
    } catch (error) {
      console.error('💥 Error in createUserProfile:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    console.log('🔐 Attempting sign in for:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
    console.log('✅ Sign in successful');
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    console.log('📝 Attempting sign up for:', email);
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
      console.error('❌ Sign up error:', error);
      throw error;
    }
    console.log('✅ Sign up successful');
  };

  const signOut = async () => {
    console.log('👋 Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
    setUserRoles([]);
    console.log('✅ Sign out successful');
  };

  const hasRole = (role: string): boolean => {
    // First check secure user_roles table
    if (userRoles.includes(role)) {
      return true;
    }
    // Admin in user_roles has access to everything
    if (userRoles.includes('admin')) {
      return true;
    }
    // Fallback to profile role for backwards compatibility
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
