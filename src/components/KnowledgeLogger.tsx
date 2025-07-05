
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, BookOpen, Tag } from "lucide-react";
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';

const KnowledgeLogger = () => {
  const [englishText, setEnglishText] = useState("");
  const [tangkhulText, setTangkhulText] = useState("");
  const [category, setCategory] = useState("");
  const [context, setContext] = useState("");
  const [tags, setTags] = useState("");
  const [trainingEntries, setTrainingEntries] = useState([]);
  const { submitTrainingData } = useTranslation();

  // Load training entries
  useEffect(() => {
    const loadTrainingEntries = async () => {
      const { data } = await supabase
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
    
    loadTrainingEntries();
  }, []);

  const handleSaveEntry = async () => {
    if (!englishText.trim() || !tangkhulText.trim()) {
      return;
    }

    try {
      await submitTrainingData(
        englishText,
        tangkhulText,
        category || "general",
        context,
        tags.split(",").map(tag => tag.trim()).filter(Boolean)
      );

      // Clear form
      setEnglishText("");
      setTangkhulText("");
      setCategory("");
      setContext("");
      setTags("");

      // Reload entries
      const { data } = await supabase
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
      {/* Add New Entry */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Plus className="w-5 h-5" />
            Contribute Training Data
          </CardTitle>
          <p className="text-sm text-gray-600">
            Help improve the AI by contributing verified translations
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
                placeholder="Enter Tangkhul translation..."
                value={tangkhulText}
                onChange={(e) => setTangkhulText(e.target.value)}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
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
              <label className="text-sm font-medium">Context/Usage Notes</label>
              <Input
                placeholder="When and how this phrase is used..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="border-orange-200 focus:border-orange-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tags (comma-separated)</label>
            <Input
              placeholder="formal, greeting, question"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="border-orange-200 focus:border-orange-400"
            />
          </div>

          <Button 
            onClick={handleSaveEntry}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            disabled={!englishText.trim() || !tangkhulText.trim()}
          >
            <Save className="w-4 h-4 mr-2" />
            Submit for Review
          </Button>
        </CardContent>
      </Card>

      {/* Training Data List */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <BookOpen className="w-5 h-5" />
            Community Contributions ({trainingEntries.length})
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
                  {entry.tags?.map(tag => (
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
