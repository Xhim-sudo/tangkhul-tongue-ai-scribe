import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Users, Activity, Clock, Zap, Target } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface ChartData {
  translationTrends: Array<{ date: string; queries: number; cacheHits: number; confidence: number }>;
  userActivity: Array<{ hour: string; submissions: number; reviews: number }>;
  performanceMetrics: Array<{ name: string; value: number }>;
  languageDistribution: Array<{ name: string; value: number }>;
  responseTimeDistribution: Array<{ range: string; count: number }>;
  weeklyGrowth: Array<{ week: string; users: number; entries: number }>;
}

const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  accent: 'hsl(var(--accent))',
  success: 'hsl(142, 76%, 36%)',
  warning: 'hsl(38, 92%, 50%)',
  muted: 'hsl(var(--muted-foreground))',
};

const AnalyticsCharts = () => {
  const [chartData, setChartData] = useState<ChartData>({
    translationTrends: [],
    userActivity: [],
    performanceMetrics: [],
    languageDistribution: [],
    responseTimeDistribution: [],
    weeklyGrowth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();

    const channel = supabase
      .channel('analytics-charts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'translation_analytics' }, () => {
        loadChartData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadChartData = async () => {
    try {
      setLoading(true);

      // Get translation analytics for trends
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: analyticsData } = await supabase
        .from('translation_analytics')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Process translation trends by day
      const trendsByDay = (analyticsData || []).reduce((acc, item) => {
        const date = new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
          acc[date] = { queries: 0, cacheHits: 0, confidenceSum: 0, count: 0 };
        }
        acc[date].queries++;
        if (item.cache_hit) acc[date].cacheHits++;
        if (item.confidence_score) {
          acc[date].confidenceSum += item.confidence_score;
          acc[date].count++;
        }
        return acc;
      }, {} as Record<string, any>);

      const translationTrends = Object.entries(trendsByDay).map(([date, data]: [string, any]) => ({
        date,
        queries: data.queries,
        cacheHits: data.cacheHits,
        confidence: data.count > 0 ? Math.round(data.confidenceSum / data.count) : 0
      }));

      // Process user activity by hour
      const activityByHour = (analyticsData || []).reduce((acc, item) => {
        const hour = new Date(item.created_at).getHours();
        const hourStr = `${hour}:00`;
        if (!acc[hourStr]) {
          acc[hourStr] = { submissions: 0, reviews: 0 };
        }
        acc[hourStr].submissions++;
        return acc;
      }, {} as Record<string, any>);

      // Get training entries for review activity
      const { data: entriesData } = await supabase
        .from('training_entries')
        .select('created_at, review_count')
        .gte('created_at', thirtyDaysAgo.toISOString());

      (entriesData || []).forEach(entry => {
        const hour = new Date(entry.created_at).getHours();
        const hourStr = `${hour}:00`;
        if (!activityByHour[hourStr]) {
          activityByHour[hourStr] = { submissions: 0, reviews: 0 };
        }
        activityByHour[hourStr].reviews += entry.review_count || 0;
      });

      const userActivity = Array.from({ length: 24 }, (_, i) => {
        const hourStr = `${i}:00`;
        return {
          hour: hourStr,
          submissions: activityByHour[hourStr]?.submissions || 0,
          reviews: activityByHour[hourStr]?.reviews || 0
        };
      });

      // Language distribution
      const langDistribution = (analyticsData || []).reduce((acc, item) => {
        const direction = `${item.source_language} → ${item.target_language}`;
        acc[direction] = (acc[direction] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const languageDistribution = Object.entries(langDistribution).map(([name, value]) => ({
        name,
        value: value as number
      }));

      // Response time distribution
      const responseRanges = { '0-50ms': 0, '50-100ms': 0, '100-200ms': 0, '200-500ms': 0, '500ms+': 0 };
      (analyticsData || []).forEach(item => {
        const time = item.response_time_ms || 0;
        if (time <= 50) responseRanges['0-50ms']++;
        else if (time <= 100) responseRanges['50-100ms']++;
        else if (time <= 200) responseRanges['100-200ms']++;
        else if (time <= 500) responseRanges['200-500ms']++;
        else responseRanges['500ms+']++;
      });

      const responseTimeDistribution = Object.entries(responseRanges).map(([range, count]) => ({
        range,
        count
      }));

      // Performance metrics
      const totalQueries = analyticsData?.length || 0;
      const cacheHits = analyticsData?.filter(d => d.cache_hit).length || 0;
      const avgConfidence = totalQueries > 0
        ? analyticsData!.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / totalQueries
        : 0;
      const avgResponseTime = totalQueries > 0
        ? analyticsData!.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / totalQueries
        : 0;

      const performanceMetrics = [
        { name: 'Cache Hit Rate', value: totalQueries > 0 ? Math.round((cacheHits / totalQueries) * 100) : 0 },
        { name: 'Avg Confidence', value: Math.round(avgConfidence) },
        { name: 'Success Rate', value: Math.round((analyticsData?.filter(d => d.result_found).length || 0) / Math.max(totalQueries, 1) * 100) },
        { name: 'Response < 200ms', value: Math.round(((responseRanges['0-50ms'] + responseRanges['50-100ms'] + responseRanges['100-200ms']) / Math.max(totalQueries, 1)) * 100) }
      ];

      // Weekly growth
      const weeklyData = (analyticsData || []).reduce((acc, item) => {
        const week = getWeekNumber(new Date(item.created_at));
        if (!acc[week]) {
          acc[week] = { users: new Set(), entries: 0 };
        }
        if (item.user_id) acc[week].users.add(item.user_id);
        acc[week].entries++;
        return acc;
      }, {} as Record<string, any>);

      const weeklyGrowth = Object.entries(weeklyData)
        .map(([week, data]: [string, any]) => ({
          week: `Week ${week}`,
          users: data.users.size,
          entries: data.entries
        }))
        .slice(-8);

      setChartData({
        translationTrends,
        userActivity,
        performanceMetrics,
        languageDistribution,
        responseTimeDistribution,
        weeklyGrowth
      });
    } catch (error) {
      console.error('Failed to load chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading analytics charts...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Detailed Analytics</h2>
        <p className="text-muted-foreground mt-1">Comprehensive translation and system metrics</p>
      </div>

      <Tabs defaultValue="trends" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6 mt-6">
          {/* Translation Volume Trend */}
          <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Translation Volume (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.translationTrends}>
                  <defs>
                    <linearGradient id="colorQueries" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCacheHits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="queries" stroke={CHART_COLORS.primary} fillOpacity={1} fill="url(#colorQueries)" name="Total Queries" />
                  <Area type="monotone" dataKey="cacheHits" stroke={CHART_COLORS.accent} fillOpacity={1} fill="url(#colorCacheHits)" name="Cache Hits" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Confidence Score Trend */}
          <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-accent" />
                Confidence Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.translationTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="confidence" stroke={CHART_COLORS.success} strokeWidth={3} dot={{ fill: CHART_COLORS.success }} name="Avg Confidence %" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          {/* Hourly Activity */}
          <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Hourly Activity Pattern
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="submissions" fill={CHART_COLORS.primary} name="Translations" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="reviews" fill={CHART_COLORS.accent} name="Reviews" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Growth */}
          <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Weekly Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={chartData.weeklyGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="users" stroke={CHART_COLORS.primary} strokeWidth={2} name="Active Users" />
                  <Line type="monotone" dataKey="entries" stroke={CHART_COLORS.accent} strokeWidth={2} name="Entries" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6 mt-6">
          {/* Performance Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {chartData.performanceMetrics.map((metric, index) => (
              <Card key={index} className="bg-surface/70 backdrop-blur-sm border-primary/20">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">{metric.name}</p>
                  <h3 className="text-3xl font-bold text-foreground mt-2">{metric.value}%</h3>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Response Time Distribution */}
          <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Response Time Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.responseTimeDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis dataKey="range" type="category" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill={CHART_COLORS.success} radius={[0, 4, 4, 0]} name="Requests" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6 mt-6">
          {/* Language Distribution */}
          <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Translation Direction Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.languageDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill={CHART_COLORS.primary}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {chartData.languageDistribution.map((_, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index % 2 === 0 ? CHART_COLORS.primary : CHART_COLORS.accent} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {chartData.languageDistribution.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: index % 2 === 0 ? CHART_COLORS.primary : CHART_COLORS.accent }}
                      />
                      <span className="text-sm text-foreground">{item.name}</span>
                      <Badge variant="outline">{item.value}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsCharts;
