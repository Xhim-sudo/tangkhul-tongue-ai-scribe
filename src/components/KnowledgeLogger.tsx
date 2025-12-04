import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import TrainingForm from './training/TrainingForm';
import CommunityOverview from './training/CommunityOverview';

const KnowledgeLogger = () => {
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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadUserStats();
      loadCommunityStats();
      
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
      const { count: submissionsCount } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true })
        .eq('contributor_id', user.id);

      const { data: userSubmissions } = await supabase
        .from('training_submissions_log')
        .select('english_text, tangkhul_text')
        .eq('contributor_id', user.id);

      let accurateSubmissions = 0;
      for (const submission of userSubmissions || []) {
        const { data: consensus } = await supabase
          .from('translation_consensus')
          .select('agreement_score')
          .eq('english_text', submission.english_text)
          .eq('tangkhul_text', submission.tangkhul_text)
          .maybeSingle();

        if (consensus && consensus.agreement_score >= 80) {
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
        rank: 1
      });
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const loadCommunityStats = async () => {
    try {
      const { count: totalSubmissions } = await supabase
        .from('training_submissions_log')
        .select('*', { count: 'exact', head: true });

      const { data: consensusData } = await supabase
        .from('translation_consensus')
        .select('*');

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
    partOfSpeech: string;
  }) => {
    // The TrainingForm now handles the submission directly
    // This is just for any additional processing needed
    loadUserStats();
    loadCommunityStats();
  };

  return (
    <div className="space-y-6 px-4 sm:px-0">
      <TrainingForm onSubmit={handleTrainingSubmit} />
      <CommunityOverview stats={communityStats} />
    </div>
  );
};

export default KnowledgeLogger;