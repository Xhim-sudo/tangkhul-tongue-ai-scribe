import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Star, Target, Medal } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';

interface Contributor {
  id: string;
  full_name: string | null;
  email: string;
  accuracy_score: number | null;
  total_submissions: number | null;
  approved_submissions: number | null;
  golden_count: number;
}

const Leaderboard = () => {
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'accuracy' | 'golden' | 'submissions'>('accuracy');

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);

      // Get all contributors with their datasets
      const { data: contributorsData } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          contributor_datasets (
            accuracy_score,
            total_submissions,
            approved_submissions
          )
        `)
        .eq('role', 'contributor')
        .order('created_at', { ascending: false });

      // Get golden data count for each contributor
      const contributorStats = await Promise.all(
        (contributorsData || []).map(async (contributor) => {
          const { count: goldenCount } = await supabase
            .from('training_submissions_log')
            .select('*', { count: 'exact', head: true })
            .eq('contributor_id', contributor.id)
            .eq('is_golden_data', true);

          return {
            id: contributor.id,
            full_name: contributor.full_name,
            email: contributor.email,
            accuracy_score: contributor.contributor_datasets?.[0]?.accuracy_score || 0,
            total_submissions: contributor.contributor_datasets?.[0]?.total_submissions || 0,
            approved_submissions: contributor.contributor_datasets?.[0]?.approved_submissions || 0,
            golden_count: goldenCount || 0
          };
        })
      );

      // Sort based on selected criteria
      const sorted = contributorStats.sort((a, b) => {
        if (sortBy === 'accuracy') return (b.accuracy_score || 0) - (a.accuracy_score || 0);
        if (sortBy === 'golden') return b.golden_count - a.golden_count;
        return (b.total_submissions || 0) - (a.total_submissions || 0);
      });

      setContributors(sorted);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>;
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 px-1 sm:p-6">
      <div>
        <h2 className="text-xl sm:text-3xl font-bold text-foreground">Contributor Leaderboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Top contributors in the community</p>
      </div>

      {/* Sort Options - Mobile Optimized */}
      <div className="flex flex-wrap gap-2 overflow-x-auto pb-2">
        <Badge
          variant={sortBy === 'accuracy' ? 'default' : 'outline'}
          className="cursor-pointer touch-target"
          onClick={() => setSortBy('accuracy')}
        >
          <Target className="w-3 h-3 mr-1" />
          By Accuracy
        </Badge>
        <Badge
          variant={sortBy === 'golden' ? 'default' : 'outline'}
          className="cursor-pointer touch-target"
          onClick={() => setSortBy('golden')}
        >
          <Star className="w-3 h-3 mr-1" />
          By Golden Data
        </Badge>
        <Badge
          variant={sortBy === 'submissions' ? 'default' : 'outline'}
          className="cursor-pointer touch-target"
          onClick={() => setSortBy('submissions')}
        >
          <Trophy className="w-3 h-3 mr-1" />
          By Submissions
        </Badge>
      </div>

      {/* Leaderboard */}
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {contributors.length > 0 ? (
            <div className="space-y-3">
              {contributors.map((contributor, index) => (
                <div
                  key={contributor.id}
                  className={`flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all ${
                    index < 3
                      ? 'bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30 shadow-glow'
                      : 'bg-muted/30 border-border hover:bg-muted/50'
                  }`}
                >
                  {/* Top row on mobile: Rank + Avatar + Info */}
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Rank */}
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                      {getRankIcon(index)}
                    </div>

                    {/* Avatar */}
                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {getInitials(contributor.full_name, contributor.email)}
                      </AvatarFallback>
                    </Avatar>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate text-sm sm:text-base">
                        {contributor.full_name || 'Anonymous'}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{contributor.email}</p>
                    </div>
                  </div>

                  {/* Stats - Full width on mobile */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto sm:ml-auto pl-[52px] sm:pl-0">
                    <Badge variant="outline" className="bg-background/50 text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      {(contributor.accuracy_score || 0).toFixed(0)}%
                    </Badge>
                    <Badge variant="outline" className="bg-background/50 text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      {contributor.golden_count}
                    </Badge>
                    <Badge variant="outline" className="bg-background/50 text-xs">
                      <Trophy className="w-3 h-3 mr-1" />
                      {contributor.total_submissions || 0}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No contributors yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Leaderboard;
