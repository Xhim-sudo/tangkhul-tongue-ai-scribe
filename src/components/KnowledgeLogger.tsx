
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import UserStats from './training/UserStats';
import TrainingForm from './training/TrainingForm';
import CommunityOverview from './training/CommunityOverview';
import TrainingEntriesList from './training/TrainingEntriesList';

const KnowledgeLogger = () => {
  const [trainingEntries, setTrainingEntries] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalContributions: 0,
    accuracy: 0,
    goldenEntries: 0,
    rank: 0
  });
  const [communityStats] = useState({
    totalEntries: 1247,
    verifiedEntries: 892,
    contributors: 15,
    averageConfidence: 87
  });
  const { submitTrainingData } = useTranslation();
  const { user } = useAuth();

  // Load training entries and user stats
  useEffect(() => {
    loadTrainingEntries();
    loadUserStats();
  }, [user]);

  const loadTrainingEntries = async () => {
    const { data } = await (supabase as any)
      .from('training_entries')
      .select(`
        *,
        profiles:contributor_id(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (data) {
      setTrainingEntries(data);
    }
  };

  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Get user's accuracy metrics
      const { data: metrics } = await (supabase as any)
        .from('accuracy_metrics')
        .select('*')
        .eq('contributor_id', user.id)
        .single();

      // Get user's rank
      const { data: allMetrics } = await (supabase as any)
        .from('accuracy_metrics')
        .select('contributor_id, accuracy_percentage')
        .order('accuracy_percentage', { ascending: false });

      const userRank = allMetrics?.findIndex(m => m.contributor_id === user.id) + 1 || 0;

      setUserStats({
        totalContributions: metrics?.total_contributions || 0,
        accuracy: metrics?.accuracy_percentage || 0,
        goldenEntries: metrics?.golden_data_count || 0,
        rank: userRank
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleTrainingSubmit = async (formData: {
    englishText: string;
    tangkhulText: string;
    category: string;
    context: string;
    tags: string;
  }) => {
    try {
      // Submit to training data
      await submitTrainingData(
        formData.englishText,
        formData.tangkhulText,
        formData.category,
        formData.context,
        formData.tags.split(",").map(tag => tag.trim()).filter(Boolean)
      );

      // Also save to contributor datasets for individual tracking
      if (user) {
        await (supabase as any)
          .from('contributor_datasets')
          .insert({
            contributor_id: user.id,
            english_text: formData.englishText,
            tangkhul_text: formData.tangkhulText,
            category: formData.category,
            context: formData.context,
            tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
            accuracy_score: 85 // Initial score, will be updated by validation
          });
      }

      // Reload data
      loadTrainingEntries();
      loadUserStats();
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Performance Dashboard */}
      <UserStats stats={userStats} />

      {/* Accuracy Progress */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">My Accuracy Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Accuracy: {userStats.accuracy}%</span>
              <span>Target: 99%</span>
            </div>
            <Progress value={userStats.accuracy} className="h-3" />
            <p className="text-xs text-gray-600">
              {userStats.accuracy >= 95 ? "Excellent! You're contributing high-quality data." :
               userStats.accuracy >= 85 ? "Good work! Keep improving your accuracy." :
               "Focus on quality translations to improve your accuracy."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Training Form */}
      <TrainingForm onSubmit={handleTrainingSubmit} />

      {/* Community Overview */}
      <CommunityOverview stats={communityStats} />

      {/* Training Entries List */}
      <TrainingEntriesList entries={trainingEntries} />
    </div>
  );
};

export default KnowledgeLogger;
