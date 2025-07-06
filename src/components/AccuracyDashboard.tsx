
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Target, Award, Database, Download, RefreshCw } from "lucide-react";
import { useDataExport } from '@/hooks/useDataExport';
import { supabase } from '@/integrations/supabase/client';

const AccuracyDashboard = () => {
  const { exportGoldenData, isExporting } = useDataExport();
  const [accuracyStats, setAccuracyStats] = useState({
    overallAccuracy: 0,
    totalEntries: 0,
    goldenEntries: 0,
    targetAccuracy: 99,
    topContributors: [] as any[],
    categoryAccuracy: [] as any[]
  });

  useEffect(() => {
    loadAccuracyStats();
  }, []);

  const loadAccuracyStats = async () => {
    try {
      // Get overall accuracy
      const { data: accuracyData } = await (supabase as any)
        .from('accuracy_metrics')
        .select('accuracy_percentage, total_contributions, golden_data_count');

      // Get golden data count
      const { data: goldenData } = await (supabase as any)
        .from('contributor_datasets')
        .select('id')
        .eq('is_golden_data', true);

      // Get total entries
      const { data: totalEntries } = await (supabase as any)
        .from('training_entries')
        .select('id');

      // Get top contributors
      const { data: topContributors } = await (supabase as any)
        .from('accuracy_metrics')
        .select(`
          *,
          profiles:contributor_id(full_name, email)
        `)
        .order('accuracy_percentage', { ascending: false })
        .limit(5);

      // Get category accuracy
      const { data: categoryData } = await (supabase as any)
        .from('training_entries')
        .select('category, status')
        .eq('status', 'approved');

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

  const accuracyColor = accuracyStats.overallAccuracy >= 99 ? 'text-green-600' : 
                       accuracyStats.overallAccuracy >= 95 ? 'text-blue-600' : 
                       accuracyStats.overallAccuracy >= 90 ? 'text-yellow-600' : 'text-red-600';

  const progressColor = accuracyStats.overallAccuracy >= 99 ? 'bg-green-500' : 
                       accuracyStats.overallAccuracy >= 95 ? 'bg-blue-500' : 
                       accuracyStats.overallAccuracy >= 90 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="space-y-6">
      {/* Main Accuracy Display */}
      <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
        <CardContent className="p-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <Target className="w-12 h-12 text-orange-200" />
              <div>
                <h2 className="text-4xl font-bold">{accuracyStats.overallAccuracy}%</h2>
                <p className="text-orange-100">Overall System Accuracy</p>
              </div>
            </div>
            
            <div className="w-full bg-orange-300/30 rounded-full h-4 mb-4">
              <div 
                className="bg-white/80 h-4 rounded-full transition-all duration-500"
                style={{ width: `${(accuracyStats.overallAccuracy / accuracyStats.targetAccuracy) * 100}%` }}
              ></div>
            </div>
            
            <div className="flex justify-center items-center gap-6 text-sm">
              <div>
                <span className="text-orange-100">Target: </span>
                <span className="font-bold">{accuracyStats.targetAccuracy}%</span>
              </div>
              <div>
                <span className="text-orange-100">Progress: </span>
                <span className="font-bold">{Math.round((accuracyStats.overallAccuracy / accuracyStats.targetAccuracy) * 100)}%</span>
              </div>
              <div>
                <span className="text-orange-100">Status: </span>
                <span className="font-bold">
                  {accuracyStats.overallAccuracy >= 99 ? 'AI Ready!' : 'Training'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
          <CardContent className="p-6 text-center">
            <Database className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{accuracyStats.totalEntries.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Training Entries</div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
          <CardContent className="p-6 text-center">
            <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{accuracyStats.goldenEntries.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Golden Dataset Entries</div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className={`text-2xl font-bold ${accuracyColor}`}>
              {accuracyStats.overallAccuracy >= 99 ? 'Ready!' : 'Training'}
            </div>
            <div className="text-sm text-gray-600">AI Integration Status</div>
          </CardContent>
        </Card>
      </div>

      {/* Management Actions */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">Golden Dataset Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={() => exportGoldenData('json')}
              disabled={isExporting}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Golden Dataset'}
            </Button>
            <Button 
              onClick={refreshGoldenData}
              variant="outline"
              className="border-orange-200 hover:bg-orange-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Golden Data
            </Button>
          </div>
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
