import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface OnlineUser {
  user_id: string;
  full_name: string | null;
  email: string;
  online_at: string;
  activity: string;
}

export const usePresence = () => {
  const { user, userProfile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel('online-users');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users: OnlineUser[] = [];
        
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            users.push({
              user_id: presence.user_id,
              full_name: presence.full_name,
              email: presence.email,
              online_at: presence.online_at,
              activity: presence.activity || 'browsing'
            });
          });
        });
        
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, () => {
        // User joined
      })
      .on('presence', { event: 'leave' }, () => {
        // User left
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            full_name: userProfile?.full_name || null,
            email: user.email || '',
            online_at: new Date().toISOString(),
            activity: 'browsing'
          });
          setIsTracking(true);
        }
      });

    return () => {
      channel.unsubscribe();
      setIsTracking(false);
    };
  }, [user?.id, userProfile?.full_name]);

  const updateActivity = async (activity: string) => {
    if (!user?.id) return;
    
    const channel = supabase.channel('online-users');
    await channel.track({
      user_id: user.id,
      full_name: userProfile?.full_name || null,
      email: user.email || '',
      online_at: new Date().toISOString(),
      activity
    });
  };

  return {
    onlineUsers,
    isTracking,
    updateActivity,
    onlineCount: onlineUsers.length
  };
};
