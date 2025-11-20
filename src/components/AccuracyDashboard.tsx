
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award } from "lucide-react";

import { supabase } from '@/integrations/supabase/client';
import AccuracyHeader from './AccuracyHeader';
import AccuracyStats from './AccuracyStats';

const AccuracyDashboard = () => {
  
  const [accuracyStats, setAccuracyStats] = useState({
    overallAccuracy: 0,
    totalEntries: 0,
    goldenEntries: 0,
    targetAccuracy: 99,
    topContributors: [] as any[],
    categoryAccuracy: [] as any[]
  });
  const [knowledgeEntries, setKnowledgeEntries] = useState<any[]>([]);

  useEffect(() => {
    loadAccuracyStats();
    loadKnowledgeEntries();
  }, []);

  const loadAccuracyStats = async () => {
    try {
      // Get overall accuracy
      const { data: accuracyData } = await supabase
        .from('accuracy_metrics')
        .select('accuracy_percentage, total_contributions, golden_data_count');

      // Get golden data count
      const { data: goldenData } = await supabase
        .from('training_entries')
        .select('id')
        .eq('is_golden_data', true);

      // Get total entries
      const { data: totalEntries } = await supabase
        .from('training_entries')
        .select('id');

      // Get top contributors
      const { data: topContributors } = await supabase
        .from('accuracy_metrics')
        .select('contributor_id, score, metric_type')
        .order('score', { ascending: false })
        .limit(5);

      // Get category accuracy
      const { data: categoryData } = await supabase
        .from('training_entries')
        .select('category_id, is_golden_data');

      // Calculate category accuracy
      const categoryStats = categoryData?.reduce((acc: any, entry: any) => {
        if (!acc[entry.category]) {
          acc[entry.category] = { approved: 0, total: 0 };
        }
        acc[entry.category].approved++;
        acc[entry.category].total++;
        return acc;
      }, {});

      const categoryAccuracy = Object.entries(categoryStats || {}).map(([category, stats]: [string, any]) => ({
        category,
        accuracy: Math.round((stats.approved / stats.total) * 100),
        count: stats.total
      }));

      // Calculate overall accuracy
      const overallAccuracy = accuracyData?.length 
        ? Math.round((accuracyData.reduce((sum: number, metric: any) => sum + parseFloat(metric.accuracy_percentage), 0) / accuracyData.length) * 100) / 100
        : 0;

      setAccuracyStats({
        overallAccuracy,
        totalEntries: totalEntries?.length || 0,
        goldenEntries: goldenData?.length || 0,
        targetAccuracy: 99,
        topContributors: topContributors || [],
        categoryAccuracy: categoryAccuracy || []
      });
    } catch (error) {
      console.error('Failed to load accuracy stats:', error);
    }
  };

  const refreshGoldenData = async () => {
    try {
      const { data, error } = await supabase.rpc('mark_golden_data');
      
      if (error) throw error;
      
      console.log(`${data} new golden entries marked`);
      loadAccuracyStats();
    } catch (error) {
      console.error('Failed to refresh golden data:', error);
    }
  };

  const loadKnowledgeEntries = async () => {
    try {
      const { data } = await supabase
        .from('training_submissions_log')
        .select('english_text, tangkhul_text, category, created_at')
        .order('created_at', { ascending: false })
        .limit(25);
      setKnowledgeEntries(data || []);
    } catch (e) {
      console.error('Failed to load knowledge entries:', e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Accuracy Display */}
      <AccuracyHeader 
        overallAccuracy={accuracyStats.overallAccuracy}
        targetAccuracy={accuracyStats.targetAccuracy}
      />

      {/* Quick Stats */}
      <AccuracyStats 
        totalEntries={accuracyStats.totalEntries}
        goldenEntries={accuracyStats.goldenEntries}
        overallAccuracy={accuracyStats.overallAccuracy}
      />

      {/* Knowledge Base (View Only) */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">Knowledge Base (Recent Submissions)</CardTitle>
        </CardHeader>
        <CardContent>
          {knowledgeEntries.length === 0 ? (
            <p className="text-gray-600">No knowledge entries yet.</p>
          ) : (
            <div className="space-y-2">
              {knowledgeEntries.map((e, idx) => (
                <div key={idx} className="p-3 bg-white/50 rounded-lg border border-orange-100">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{e.english_text}</span>
                    <Badge variant="outline" className="border-orange-200">{e.category || 'general'}</Badge>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">→ {e.tangkhul_text}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(e.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Accuracy Breakdown */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">Category Accuracy Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {accuracyStats.categoryAccuracy.map((category) => (
              <div key={category.category} className="p-4 bg-white/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium capitalize">{category.category}</span>
                  <Badge className={
                    category.accuracy >= 95 ? "bg-green-100 text-green-800" :
                    category.accuracy >= 90 ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }>
                    {category.accuracy}%
                  </Badge>
                </div>
                <Progress value={category.accuracy} className="h-2 mb-1" />
                <p className="text-xs text-gray-600">{category.count} entries</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Contributors */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Award className="w-5 h-5" />
            Top Accuracy Contributors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accuracyStats.topContributors.map((contributor, index) => (
              <div key={contributor.id} className="flex items-center gap-3 p-3 bg-white/50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{contributor.profiles?.full_name || 'Anonymous'}</span>
                    <Badge className={
                      contributor.accuracy_percentage >= 95 ? "bg-green-100 text-green-800" :
                      contributor.accuracy_percentage >= 90 ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }>
                      {contributor.accuracy_percentage}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{contributor.total_contributions} contributions</span>
                    <span>{contributor.golden_data_count} golden entries</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccuracyDashboard;
