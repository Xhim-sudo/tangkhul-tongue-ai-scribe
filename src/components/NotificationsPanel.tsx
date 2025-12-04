import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, Send, AtSign, Check, Trash2, 
  MessageSquare, Award 
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Notification {
  id: string;
  type: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  read: boolean;
  created_at: string;
  from_user_name?: string;
  from_user_email?: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

const NotificationsPanel = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadUsers();
      
      const channel = supabase
        .channel('notifications-changes')
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `to_user_id=eq.${user.id}`
        }, () => {
          loadNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Get notifications
      const { data: notifData, error: notifError } = await supabase
        .from('notifications')
        .select('*')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (notifError) throw notifError;

      if (!notifData || notifData.length === 0) {
        setNotifications([]);
        return;
      }

      // Get unique from_user_ids
      const fromUserIds = [...new Set(notifData.map(n => n.from_user_id))];
      
      // Fetch profiles for those users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', fromUserIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const formatted: Notification[] = notifData.map((notif) => {
        const fromProfile = profileMap.get(notif.from_user_id);
        return {
          id: notif.id,
          type: notif.type,
          from_user_id: notif.from_user_id,
          to_user_id: notif.to_user_id,
          message: notif.message,
          read: notif.read,
          created_at: notif.created_at,
          from_user_name: fromProfile?.full_name || null,
          from_user_email: fromProfile?.email || 'Unknown'
        };
      });

      setNotifications(formatted);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .order('full_name', { ascending: true });

      setUsers(data || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser) {
      toast.error('Please select a user and enter a message');
      return;
    }

    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          type: message.includes('@') ? 'mention' : 'message',
          from_user_id: user!.id,
          to_user_id: selectedUser,
          message: message,
          read: false
        });

      if (error) throw error;

      toast.success('Message sent successfully');
      setMessage('');
      setSelectedUser('');
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Notification deleted');
      loadNotifications();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-4 h-4" />;
      case 'approval':
        return <Check className="w-4 h-4" />;
      case 'achievement':
        return <Award className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'mention':
        return 'bg-accent';
      case 'approval':
        return 'bg-green-500';
      case 'achievement':
        return 'bg-primary';
      default:
        return 'bg-secondary';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6 pt-16 pb-24 sm:pt-6 sm:pb-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold text-foreground">Notifications</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 && `${unreadCount} unread`}
          </p>
        </div>
        <Bell className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Send Message Card */}
        <Card className="lg:col-span-1 glass border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Send Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">To:</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => u.id !== user?.id)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{u.full_name || u.email}</span>
                          <Badge variant="outline" className="text-xs">
                            {u.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Message:</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="min-h-[80px]"
              />
            </div>

            <Button 
              onClick={handleSendMessage}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <Send className="w-4 h-4 mr-2" />
              Send
            </Button>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="lg:col-span-2 glass border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] sm:h-[500px] pr-2">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No notifications yet</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 sm:p-4 rounded-lg border transition-all ${
                        notif.read 
                          ? 'bg-muted/30 border-border' 
                          : 'bg-primary/10 border-primary/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${getTypeColor(notif.type)} text-white shrink-0`}>
                          {getIcon(notif.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm sm:text-base truncate">
                            {notif.from_user_name || notif.from_user_email}
                          </p>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(notif.created_at).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex gap-1 shrink-0">
                          {!notif.read && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="h-8 w-8"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(notif.id)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotificationsPanel;