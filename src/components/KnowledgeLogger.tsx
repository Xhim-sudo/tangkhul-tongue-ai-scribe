
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Save, BookOpen, Tag, TrendingUp, Award, Target } from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const KnowledgeLogger = () => {
  const [englishText, setEnglishText] = useState("");
  const [tangkhulText, setTangkhulText] = useState("");
  const [category, setCategory] = useState("");
  const [context, setContext] = useState("");
  const [tags, setTags] = useState("");
  const [trainingEntries, setTrainingEntries] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({
    totalContributions: 0,
    accuracy: 0,
    goldenEntries: 0,
    rank: 0
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

  const handleSaveEntry = async () => {
    if (!englishText.trim() || !tangkhulText.trim()) {
      return;
    }

    try {
      // Submit to training data
      await submitTrainingData(
        englishText,
        tangkhulText,
        category || "general",
        context,
        tags.split(",").map(tag => tag.trim()).filter(Boolean)
      );

      // Also save to contributor datasets for individual tracking
      if (user) {
        await (supabase as any)
          .from('contributor_datasets')
          .insert({
            contributor_id: user.id,
            english_text: englishText,
            tangkhul_text: tangkhulText,
            category: category || "general",
            context,
            tags: tags.split(",").map(tag => tag.trim()).filter(Boolean),
            accuracy_score: 85 // Initial score, will be updated by validation
          });
      }

      // Clear form
      setEnglishText("");
      setTangkhulText("");
      setCategory("");
      setContext("");
      setTags("");

      // Reload data
      loadTrainingEntries();
      loadUserStats();
    } catch (error) {
      console.error('Failed to save entry:', error);
    }
  };

  const categories = [
    "greetings", "expressions", "numbers", "colors", "family", 
    "food", "nature", "time", "directions", "emotions"
  ];

  return (
    <div className="space-y-6">
      {/* User Performance Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">My Contributions</p>
                <p className="text-2xl font-bold">{userStats.totalContributions}</p>
              </div>
              <BookOpen className="w-6 h-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">My Accuracy</p>
                <p className="text-2xl font-bold">{userStats.accuracy}%</p>
              </div>
              <Target className="w-6 h-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Golden Entries</p>
                <p className="text-2xl font-bold">{userStats.goldenEntries}</p>
              </div>
              <Award className="w-6 h-6 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">My Rank</p>
                <p className="text-2xl font-bold">#{userStats.rank}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

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

      {/* Add New Entry - Enhanced */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Plus className="w-5 h-5" />
            Contribute High-Quality Training Data
          </CardTitle>
          <p className="text-sm text-gray-600">
            Your contributions help build the AI model. Accuracy is key for reaching our 99% target!
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">English Text</label>
              <Textarea
                placeholder="Enter English text..."
                value={englishText}
                onChange={(e) => setEnglishText(e.target.value)}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tangkhul Translation</label>
              <Textarea
                placeholder="Enter accurate Tangkhul translation..."
                value={tangkhulText}
                onChange={(e) => setTangkhulText(e.target.value)}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="border-orange-200">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Context/Usage</label>
              <Textarea
                placeholder="When and how is this used?"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="border-orange-200 focus:border-orange-400 h-10"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Textarea
                placeholder="formal, casual, question"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="border-orange-200 focus:border-orange-400 h-10"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              💡 Tip: High-accuracy contributions become part of the golden dataset
            </div>
            <Button 
              onClick={handleSaveEntry}
              className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              disabled={!englishText.trim() || !tangkhulText.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Submit for Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Training Data List - Enhanced */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <BookOpen className="w-5 h-5" />
            Recent Community Contributions ({trainingEntries.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trainingEntries.map((entry) => (
              <div key={entry.id} className="border border-orange-200 rounded-lg p-4 bg-white/50">
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">English</label>
                    <p className="font-medium">{entry.english_text}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Tangkhul</label>
                    <p className="font-medium text-orange-700">{entry.tangkhul_text}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <Badge variant="outline" className="border-orange-200">
                    {entry.category}
                  </Badge>
                  <Badge variant={
                    entry.status === 'approved' ? "default" :
                    entry.status === 'pending' ? "secondary" : "destructive"
                  }>
                    {entry.status}
                  </Badge>
                  <Badge variant="outline" className={
                    entry.confidence_score >= 90 ? "border-green-200 text-green-700" :
                    entry.confidence_score >= 75 ? "border-yellow-200 text-yellow-700" :
                    "border-red-200 text-red-700"
                  }>
                    {entry.confidence_score}% confidence
                  </Badge>
                  {entry.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-orange-100 text-orange-700">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {entry.context && (
                  <p className="text-sm text-gray-600 mt-2">
                    <span className="font-medium">Context:</span> {entry.context}
                  </p>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  By {entry.profiles?.full_name || 'Anonymous'} • {new Date(entry.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeLogger;
