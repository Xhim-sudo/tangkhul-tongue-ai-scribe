import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Zap, Search } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsData {
  totalQueries: number;
  cacheHitRate: number;
  avgConfidence: number;
  avgResponseTime: number;
  topPhrases: Array<{ phrase: string; count: number }>;
  confidenceTrend: Array<{ date: string; score: number }>;
}

const TranslationAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalQueries: 0,
    cacheHitRate: 0,
    avgConfidence: 0,
    avgResponseTime: 0,
    topPhrases: [],
    confidenceTrend: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('analytics-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'translation_analytics' }, () => {
        loadAnalytics();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);

      // Get total queries
      const { count: totalQueries } = await supabase
        .from('translation_analytics')
        .select('*', { count: 'exact', head: true });

      // Get cache hit rate
      const { data: cacheData } = await supabase
        .from('translation_analytics')
        .select('cache_hit');
      
      const cacheHits = cacheData?.filter(d => d.cache_hit).length || 0;
      const cacheHitRate = cacheData?.length ? (cacheHits / cacheData.length) * 100 : 0;

      // Get average confidence
      const { data: confidenceData } = await supabase
        .from('translation_analytics')
        .select('confidence_score');
      
      const avgConfidence = confidenceData?.length 
        ? confidenceData.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / confidenceData.length 
        : 0;

      // Get average response time
      const { data: responseData } = await supabase
        .from('translation_analytics')
        .select('response_time_ms');
      
      const avgResponseTime = responseData?.length 
        ? responseData.reduce((sum, d) => sum + (d.response_time_ms || 0), 0) / responseData.length 
        : 0;

      // Get top phrases
      const { data: phrasesData } = await supabase
        .from('translation_analytics')
        .select('query_text')
        .order('created_at', { ascending: false })
        .limit(100);

      const phraseCounts = phrasesData?.reduce((acc, d) => {
        acc[d.query_text] = (acc[d.query_text] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const topPhrases = Object.entries(phraseCounts)
        .map(([phrase, count]) => ({ phrase, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Get confidence trend (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: trendData } = await supabase
        .from('translation_analytics')
        .select('created_at, confidence_score')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      const trendByDay = trendData?.reduce((acc, d) => {
        const date = new Date(d.created_at).toLocaleDateString();
        if (!acc[date]) acc[date] = [];
        if (d.confidence_score) acc[date].push(d.confidence_score);
        return acc;
      }, {} as Record<string, number[]>) || {};

      const confidenceTrend = Object.entries(trendByDay).map(([date, scores]) => ({
        date,
        score: scores.reduce((sum, s) => sum + s, 0) / scores.length
      }));

      setAnalytics({
        totalQueries: totalQueries || 0,
        cacheHitRate,
        avgConfidence,
        avgResponseTime,
        topPhrases,
        confidenceTrend
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground">Translation Analytics</h2>
        <p className="text-muted-foreground mt-1">Real-time API usage and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Queries</p>
                <h3 className="text-3xl font-bold mt-1">{analytics.totalQueries}</h3>
              </div>
              <Activity className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent to-accent-dark text-accent-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Cache Hit Rate</p>
                <h3 className="text-3xl font-bold mt-1">{analytics.cacheHitRate.toFixed(1)}%</h3>
              </div>
              <Zap className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary to-secondary-dark text-secondary-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Confidence</p>
                <h3 className="text-3xl font-bold mt-1">{analytics.avgConfidence.toFixed(1)}%</h3>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success to-success-dark text-success-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Avg Response</p>
                <h3 className="text-3xl font-bold mt-1">{analytics.avgResponseTime.toFixed(0)}ms</h3>
              </div>
              <Activity className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Trend */}
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5 text-primary" />
            Confidence Score Trend (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.confidenceTrend.length > 0 ? (
            <div className="space-y-3">
              {analytics.confidenceTrend.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{item.date}</span>
                    <span className="font-semibold text-foreground">{item.score.toFixed(1)}%</span>
                  </div>
                  <Progress value={item.score} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No trend data available yet</p>
          )}
        </CardContent>
      </Card>

      {/* Top Searched Phrases */}
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Search className="w-5 h-5 text-primary" />
            Most Searched Phrases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topPhrases.length > 0 ? (
            <div className="space-y-3">
              {analytics.topPhrases.map((item, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-primary border-primary">
                      #{index + 1}
                    </Badge>
                    <span className="font-medium text-foreground">{item.phrase}</span>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">
                    {item.count} searches
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No search data available yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationAnalytics;
