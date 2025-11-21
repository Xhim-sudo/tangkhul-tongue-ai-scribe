import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, Send, AtSign, Check, Trash2, 
  MessageSquare, UserPlus, Award 
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
  type: 'message' | 'mention' | 'approval' | 'achievement';
  from_user_id: string;
  to_user_id: string;
  message: string;
  read: boolean;
  created_at: string;
  from_user?: {
    full_name: string | null;
    email: string;
  };
}

const NotificationsPanel = () => {
  const { user, userProfile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
      loadUsers();
      
      // Set up real-time subscription for notifications
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

      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          from_profile:profiles!notifications_from_user_id_fkey(full_name, email)
        `)
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted = (data || []).map((notif: any) => ({
        id: notif.id,
        type: notif.type,
        from_user_id: notif.from_user_id,
        to_user_id: notif.to_user_id,
        message: notif.message,
        read: notif.read,
        created_at: notif.created_at,
        from_user: {
          full_name: notif.from_profile?.full_name,
          email: notif.from_profile?.email
        }
      }));

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
        return 'from-accent to-accent-dark';
      case 'approval':
        return 'from-success to-success-dark';
      case 'achievement':
        return 'from-primary to-primary-dark';
      default:
        return 'from-secondary to-secondary-dark';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gradient-primary">Notifications</h2>
          <p className="text-muted-foreground mt-1">
            {unreadCount > 0 && `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`}
          </p>
        </div>
        <Bell className="w-8 h-8 text-primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Message Card */}
        <Card className="lg:col-span-1 glass border-primary/20 h-fit">
          <CardHeader>
            <CardTitle className="text-lg">Send Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">To:</label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users
                    .filter(u => u.id !== user?.id)
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <div className="flex items-center gap-2">
                          <span>{u.full_name || u.email}</span>
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
                placeholder="Type your message... Use @ to mention"
                className="min-h-[100px]"
              />
            </div>

            <Button 
              onClick={handleSendMessage}
              className="w-full bg-primary hover:bg-primary-dark"
            >
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card className="lg:col-span-2 glass border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Recent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px] pr-4">
              {loading ? (
                <p className="text-center text-muted-foreground py-8">Loading...</p>
              ) : notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No notifications yet</p>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-lg border transition-all ${
                        notif.read 
                          ? 'bg-surface border-border' 
                          : 'bg-gradient-to-r ' + getTypeColor(notif.type) + ' border-transparent text-white shadow-glow'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${notif.read ? 'bg-muted' : 'bg-white/20'}`}>
                          {getIcon(notif.type)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`font-semibold ${notif.read ? 'text-foreground' : 'text-white'}`}>
                                {notif.from_user?.full_name || notif.from_user?.email}
                              </p>
                              <p className={`text-sm ${notif.read ? 'text-muted-foreground' : 'text-white/90'}`}>
                                {notif.message}
                              </p>
                              <p className={`text-xs mt-1 ${notif.read ? 'text-muted-foreground' : 'text-white/70'}`}>
                                {new Date(notif.created_at).toLocaleString()}
                              </p>
                            </div>

                            <div className="flex gap-1">
                              {!notif.read && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className={notif.read ? '' : 'text-white hover:bg-white/20'}
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(notif.id)}
                                className={notif.read ? '' : 'text-white hover:bg-white/20'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
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
