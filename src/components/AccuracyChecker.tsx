import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { toast } from "@/hooks/use-toast";

interface WordSimilarity {
  id: string;
  english_text: string;
  tangkhul_text: string;
  contributor_name: string;
  similarity_score: number;
  created_at: string;
  is_golden_data: boolean;
}

const AccuracyChecker = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [allEntries, setAllEntries] = useState<WordSimilarity[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<WordSimilarity[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallAccuracy, setOverallAccuracy] = useState(0);

  useEffect(() => {
    loadAllEntries();
  }, []);

  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = allEntries.filter(entry => 
        entry.english_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.tangkhul_text.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEntries(filtered);
    } else {
      setFilteredEntries(allEntries);
    }
  }, [searchTerm, allEntries]);

  const loadAllEntries = async () => {
    try {
      setLoading(true);

      // Get all training submissions with profile data
      const { data: submissions, error } = await supabase
        .from('training_submissions_log')
        .select(`
          id,
          english_text,
          tangkhul_text,
          created_at,
          is_golden_data,
          contributor_id,
          profiles!training_submissions_log_contributor_id_fkey (
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Calculate similarity scores for each entry
      const entriesWithScores = await Promise.all(
        (submissions || []).map(async (entry: any) => {
          const score = await calculateSimilarityScore(entry.english_text, entry.tangkhul_text);
          return {
            id: entry.id,
            english_text: entry.english_text,
            tangkhul_text: entry.tangkhul_text,
            contributor_name: entry.profiles?.full_name || 'Anonymous',
            similarity_score: score,
            created_at: entry.created_at,
            is_golden_data: entry.is_golden_data
          };
        })
      );

      setAllEntries(entriesWithScores);
      setFilteredEntries(entriesWithScores);

      // Calculate overall accuracy
      const avgScore = entriesWithScores.reduce((sum, e) => sum + e.similarity_score, 0) / entriesWithScores.length;
      setOverallAccuracy(Math.round(avgScore));

    } catch (error) {
      console.error('Failed to load entries:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load translation entries.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSimilarityScore = async (text1: string, text2: string): Promise<number> => {
    try {
      const { data, error } = await supabase.rpc('calculate_similarity', {
        text1: text1.toLowerCase(),
        text2: text2.toLowerCase()
      });

      if (error) {
        console.error('Similarity calculation error:', error);
        return 50; // Default score if calculation fails
      }

      return Math.round((data || 0.5) * 100);
    } catch (error) {
      console.error('Similarity calculation error:', error);
      return 50;
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 90) return 'text-accent';
    if (score >= 70) return 'text-secondary';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Fair';
    return 'Needs Review';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">Loading accuracy data...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Accuracy Header */}
      <Card className="bg-gradient-to-br from-primary to-primary-dark text-primary-foreground border-0">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <TrendingUp className="w-12 h-12 opacity-80" />
              <div>
                <h2 className="text-4xl font-bold">{overallAccuracy}%</h2>
                <p className="text-sm opacity-90">Overall Translation Accuracy</p>
              </div>
            </div>
            <Progress value={overallAccuracy} className="h-3 bg-primary-foreground/20" />
            <div className="mt-4 text-sm opacity-90">
              Based on {allEntries.length} entries with similarity analysis
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Bar */}
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search by English or Tangkhul text..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </CardContent>
      </Card>

      {/* Entries List with Similarity Scores */}
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardHeader>
          <CardTitle className="text-foreground">
            Translation Accuracy Analysis ({filteredEntries.length} entries)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEntries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              {searchTerm ? 'No matching entries found.' : 'No entries available.'}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map((entry) => (
                <div 
                  key={entry.id}
                  className="p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{entry.english_text}</span>
                        {entry.is_golden_data && (
                          <Badge variant="default" className="bg-accent text-accent-foreground">
                            Golden
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">→ {entry.tangkhul_text}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge 
                        variant="outline" 
                        className={`${getSimilarityColor(entry.similarity_score)} border-current`}
                      >
                        {entry.similarity_score}%
                      </Badge>
                      <span className={`text-xs ${getSimilarityColor(entry.similarity_score)}`}>
                        {getSimilarityLabel(entry.similarity_score)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>By {entry.contributor_name}</span>
                    <span>{new Date(entry.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* Similarity Progress Bar */}
                  <div className="mt-3">
                    <Progress 
                      value={entry.similarity_score} 
                      className="h-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accuracy Distribution */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              <p className="text-sm text-muted-foreground">Excellent (90%+)</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {filteredEntries.filter(e => e.similarity_score >= 90).length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/10 border-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <p className="text-sm text-muted-foreground">Good (70-89%)</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {filteredEntries.filter(e => e.similarity_score >= 70 && e.similarity_score < 90).length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-warning/10 border-warning/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-warning" />
              <p className="text-sm text-muted-foreground">Fair (50-69%)</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {filteredEntries.filter(e => e.similarity_score >= 50 && e.similarity_score < 70).length}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-muted-foreground">Needs Review (&lt;50%)</p>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {filteredEntries.filter(e => e.similarity_score < 50).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AccuracyChecker;
