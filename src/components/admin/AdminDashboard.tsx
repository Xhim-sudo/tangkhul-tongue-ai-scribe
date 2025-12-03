import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, Database, Star, TrendingUp, 
  Activity, Clock, CheckCircle, AlertCircle 
} from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { usePresence } from '@/hooks/usePresence';

interface SystemStats {
  totalUsers: number;
  totalTranslations: number;
  goldenDataCount: number;
  todayContributions: number;
  cacheSize: number;
  avgConfidence: number;
}

const AdminDashboard = () => {
  const { onlineCount } = usePresence();
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalTranslations: 0,
    goldenDataCount: 0,
    todayContributions: 0,
    cacheSize: 0,
    avgConfidence: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        usersRes,
        translationsRes,
        goldenRes,
        todayRes,
        cacheRes,
        avgConfRes
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('training_entries').select('*', { count: 'exact', head: true }),
        supabase.from('training_entries').select('*', { count: 'exact', head: true }).eq('is_golden_data', true),
        supabase.from('training_entries').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('translation_cache').select('*', { count: 'exact', head: true }),
        supabase.from('training_entries').select('confidence_score').not('confidence_score', 'is', null)
      ]);

      const avgConfidence = avgConfRes.data?.length 
        ? avgConfRes.data.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / avgConfRes.data.length
        : 0;

      setStats({
        totalUsers: usersRes.count || 0,
        totalTranslations: translationsRes.count || 0,
        goldenDataCount: goldenRes.count || 0,
        todayContributions: todayRes.count || 0,
        cacheSize: cacheRes.count || 0,
        avgConfidence: Math.round(avgConfidence)
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">Loading dashboard...</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Total Users</p>
                <h3 className="text-2xl font-bold">{stats.totalUsers}</h3>
              </div>
              <Users className="w-8 h-8 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent to-accent-dark text-accent-foreground border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Online Now</p>
                <h3 className="text-2xl font-bold">{onlineCount}</h3>
              </div>
              <Activity className="w-8 h-8 opacity-70 animate-pulse" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success to-success-dark text-success-foreground border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Translations</p>
                <h3 className="text-2xl font-bold">{stats.totalTranslations}</h3>
              </div>
              <Database className="w-8 h-8 opacity-70" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-warning to-warning-dark text-warning-foreground border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-80">Golden Data</p>
                <h3 className="text-2xl font-bold">{stats.goldenDataCount}</h3>
              </div>
              <Star className="w-8 h-8 opacity-70" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Today's Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{stats.todayContributions}</div>
            <p className="text-sm text-muted-foreground">contributions today</p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Average Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{stats.avgConfidence}%</div>
            <Progress value={stats.avgConfidence} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* System Health */}
      <Card className="glass border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <Badge variant="default" className="bg-success">Online</Badge>
              <p className="text-xs text-muted-foreground mt-2">Database</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <Badge variant="default" className="bg-success">Active</Badge>
              <p className="text-xs text-muted-foreground mt-2">Realtime</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <Badge variant="default" className="bg-success">Ready</Badge>
              <p className="text-xs text-muted-foreground mt-2">Edge Functions</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg text-center">
              <Badge variant="secondary">{stats.cacheSize} items</Badge>
              <p className="text-xs text-muted-foreground mt-2">Cache</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
