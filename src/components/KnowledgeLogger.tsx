
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
  const [communityStats, setCommunityStats] = useState({
    totalEntries: 0,
    verifiedEntries: 0,
    contributors: 10,
    averageConfidence: 100
  });
  const { submitTrainingData } = useTranslation();
  const { user } = useAuth();

  // Load training entries and user stats with real-time updates
  useEffect(() => {
    if (user) {
      loadUserStats();
      loadCommunityStats();
      
      // Set up real-time subscription for submissions
      const channel = supabase
        .channel('training-submissions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'training_submissions_log'
          },
          () => {
            loadUserStats();
            loadCommunityStats();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);


  const loadUserStats = async () => {
    if (!user) return;

    try {
      // Get user's submissions count
      const { count: submissionsCount, error: submissionsError } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', user.id);

      if (submissionsError) throw submissionsError;

      // Calculate accuracy based on consensus matches
      const { data: userSubmissions, error: userSubmissionsError } = await supabase
        .from('training_submissions_log')
        .select('english_text, tangkhul_text')
        .eq('contributor_id', user.id);

      if (userSubmissionsError) throw userSubmissionsError;

      let accurateSubmissions = 0;
      for (const submission of userSubmissions || []) {
        const { data: consensus, error: consensusError } = await supabase
          .from('translation_consensus')
          .select('agreement_score')
          .eq('english_text', submission.english_text)
          .eq('tangkhul_text', submission.tangkhul_text)
          .single();

        if (!consensusError && consensus && consensus.agreement_score >= 80) {
          accurateSubmissions++;
        }
      }

      const accuracy = submissionsCount && submissionsCount > 0 
        ? (accurateSubmissions / submissionsCount) * 100 
        : 0;

      setUserStats({
        totalContributions: submissionsCount || 0,
        accuracy: Math.round(accuracy * 100) / 100,
        goldenEntries: accurateSubmissions,
        rank: 1 // Simplified for now
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadCommunityStats = async () => {
    try {
      // Get total submissions
      const { count: totalSubmissions } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true });

      // Get consensus data
      const { data: consensusData } = await supabase
        .from('translation_consensus')
        .select('*');

      // Get unique contributors
      const { data: contributorData } = await supabase
        .from('training_submissions_log')
        .select('contributor_id');

      const uniqueContributors = new Set(contributorData?.map(c => c.contributor_id) || []).size;

      setCommunityStats({
        totalEntries: totalSubmissions || 0,
        verifiedEntries: consensusData?.filter(c => c.is_golden_data).length || 0,
        contributors: uniqueContributors || 0,
        averageConfidence: consensusData && consensusData.length > 0 
          ? Math.round(consensusData.reduce((sum, c) => sum + (c.agreement_score || 0), 0) / consensusData.length)
          : 0
      });
    } catch (error) {
      console.error('Failed to load community stats:', error);
    }
  };

  const handleTrainingSubmit = async (formData: {
    englishText: string;
    tangkhulText: string;
    category: string;
    context: string;
    tags: string;
  }) => {
    if (!user) return;

    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      // Generate hash for the English text
      const encoder = new TextEncoder();
      const data = encoder.encode(formData.englishText.toLowerCase().trim());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const { error } = await supabase
        .from('training_submissions_log')
        .insert({
          english_text: formData.englishText,
          tangkhul_text: formData.tangkhulText,
          category: formData.category,
          context: formData.context || null,
          tags: tagsArray,
          contributor_id: user.id,
          submission_hash: hashHex
        });

      if (error) throw error;

      // Stats will reload automatically via real-time subscription
    } catch (error: any) {
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

    </div>
  );
};

export default KnowledgeLogger;
