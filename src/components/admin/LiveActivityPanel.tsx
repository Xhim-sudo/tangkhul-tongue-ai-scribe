import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Activity, Users, Circle, Clock } from "lucide-react";
import { usePresence } from '@/hooks/usePresence';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface RecentActivity {
  id: string;
  type: string;
  user_name: string;
  english_text: string;
  tangkhul_text: string;
  created_at: string;
}

const LiveActivityPanel = () => {
  const { onlineUsers, onlineCount } = usePresence();
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  useEffect(() => {
    loadRecentActivities();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('live-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'training_entries' },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', payload.new.contributor_id)
            .single();

          const newActivity: RecentActivity = {
            id: payload.new.id,
            type: 'contribution',
            user_name: profile?.full_name || 'Anonymous',
            english_text: payload.new.english_text,
            tangkhul_text: payload.new.tangkhul_text,
            created_at: payload.new.created_at
          };

          setRecentActivities((prev) => [newActivity, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadRecentActivities = async () => {
    const { data } = await supabase
      .from('training_entries')
      .select(`
        id,
        english_text,
        tangkhul_text,
        created_at,
        profiles:contributor_id (full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setRecentActivities(
        data.map((entry: any) => ({
          id: entry.id,
          type: 'contribution',
          user_name: entry.profiles?.full_name || 'Anonymous',
          english_text: entry.english_text,
          tangkhul_text: entry.tangkhul_text,
          created_at: entry.created_at
        }))
      );
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Online Users */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Online Users
            <Badge variant="default" className="ml-auto">
              <Circle className="w-2 h-2 mr-1 fill-current animate-pulse" />
              {onlineCount} online
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {onlineUsers.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {onlineUsers.map((user) => (
                <div
                  key={user.user_id}
                  className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg"
                >
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {getInitials(user.full_name || user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <Circle className="w-3 h-3 absolute -bottom-0.5 -right-0.5 fill-green-500 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{user.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.activity}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No users online</p>
          )}
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent" />
            Live Activity Feed
            <Badge variant="secondary" className="ml-auto animate-pulse">
              Live
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            <AnimatePresence>
              {recentActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="p-3 bg-muted/30 rounded-lg border border-border"
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                        {getInitials(activity.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{activity.user_name}</span>
                        <Badge variant="outline" className="text-xs">contributed</Badge>
                      </div>
                      <p className="text-sm text-foreground mt-1 truncate">{activity.english_text}</p>
                      <p className="text-sm text-muted-foreground truncate">→ {activity.tangkhul_text}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {getTimeAgo(activity.created_at)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveActivityPanel;
