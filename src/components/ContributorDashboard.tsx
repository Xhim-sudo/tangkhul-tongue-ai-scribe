import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, CheckCircle, Star } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ContributorStats {
  totalSubmissions: number;
  goldenDataCount: number;
  accuracyScore: number;
  recentSubmissions: any[];
}

const ContributorDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ContributorStats>({
    totalSubmissions: 0,
    goldenDataCount: 0,
    accuracyScore: 0,
    recentSubmissions: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadContributorStats();
    }
  }, [user?.id]);

  const loadContributorStats = async () => {
    try {
      setLoading(true);

      // Get total submissions
      const { count: totalSubmissions } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', user?.id);

      // Get golden data count
      const { count: goldenDataCount } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', user?.id)
        .eq('is_golden_data', true);

      // Get recent submissions
      const { data: recentSubmissions } = await supabase
        .from('training_submissions_log')
        .select('*')
        .eq('contributor_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate accuracy score
      const accuracyScore = totalSubmissions ? 
        Math.round((goldenDataCount || 0) / totalSubmissions * 100) : 0;

      setStats({
        totalSubmissions: totalSubmissions || 0,
        goldenDataCount: goldenDataCount || 0,
        accuracyScore,
        recentSubmissions: recentSubmissions || []
      });
    } catch (error) {
      console.error('Failed to load contributor stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">Loading your stats...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1">
      {/* Stats Overview - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Submissions</p>
                <h3 className="text-3xl font-bold mt-1">{stats.totalSubmissions}</h3>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent to-accent-dark text-accent-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Golden Data</p>
                <h3 className="text-3xl font-bold mt-1">{stats.goldenDataCount}</h3>
              </div>
              <Star className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary to-secondary-dark text-secondary-foreground border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Accuracy Score</p>
                <h3 className="text-3xl font-bold mt-1">{stats.accuracyScore}%</h3>
              </div>
              <Award className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy Progress */}
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Award className="w-5 h-5 text-primary" />
            Your Accuracy Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Current Score</span>
                <span className="font-semibold text-foreground">{stats.accuracyScore}%</span>
              </div>
              <Progress value={stats.accuracyScore} className="h-3" />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Golden Entries</p>
                <p className="text-lg font-bold text-foreground">{stats.goldenDataCount}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">Total Contributions</p>
                <p className="text-lg font-bold text-foreground">{stats.totalSubmissions}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentSubmissions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No submissions yet. Start contributing!</p>
          ) : (
            <div className="space-y-3">
              {stats.recentSubmissions.map((submission, index) => (
                <div 
                  key={index} 
                  className="p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{submission.english_text}</span>
                        {submission.is_golden_data && (
                          <Badge variant="default" className="bg-accent text-accent-foreground">
                            <Star className="w-3 h-3 mr-1" />
                            Golden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">→ {submission.tangkhul_text}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(submission.created_at).toLocaleString()}
                      </p>
                    </div>
                    {submission.is_golden_data && (
                      <CheckCircle className="w-5 h-5 text-accent flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ContributorDashboard;
