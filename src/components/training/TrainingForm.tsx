
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import GrammarFeaturesInput from "./GrammarFeaturesInput";
import { toast } from "@/hooks/use-toast";

interface TrainingFormProps {
  onSubmit: (data: {
    englishText: string;
    tangkhulText: string;
    category: string;
    context: string;
    tags: string;
    partOfSpeech: string;
  }) => void;
  isLoading?: boolean;
}

const TrainingForm = ({ onSubmit, isLoading = false }: TrainingFormProps) => {
  const [englishText, setEnglishText] = useState("");
  const [tangkhulText, setTangkhulText] = useState("");
  const [category, setCategory] = useState("");
  const [context, setContext] = useState("");
  const [tags, setTags] = useState("");
  const [partOfSpeech, setPartOfSpeech] = useState("");
  const [grammaticalFeatures, setGrammaticalFeatures] = useState<Record<string, any>>({});
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);

  // Load categories from database with real-time updates
  useEffect(() => {
    loadCategories();
    
    // Set up real-time subscription for categories
    const channel = supabase
      .channel('training-categories-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'training_categories'
        },
        () => {
          loadCategories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('training_categories')
        .select('id, name')
        .order('name');
      
      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      // Fallback to default categories if database query fails
      setCategories([
        { id: '1', name: 'greetings' },
        { id: '2', name: 'expressions' },
        { id: '3', name: 'numbers' },
        { id: '4', name: 'colors' },
        { id: '5', name: 'family' },
        { id: '6', name: 'food' },
        { id: '7', name: 'nature' },
        { id: '8', name: 'time' },
        { id: '9', name: 'directions' },
        { id: '10', name: 'emotions' }
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!englishText.trim() || !tangkhulText.trim()) return;

    // 1) Call existing onSubmit to preserve current behavior
    onSubmit({
      englishText,
      tangkhulText,
      category: category || "general",
      context,
      tags,
      partOfSpeech: partOfSpeech || 'unknown'
    });

    // 2) Also log to Knowledge Log (training_submissions_log)
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const contributorId = userRes?.user?.id;
      if (!contributorId) {
        console.warn('User not authenticated, skipping knowledge log insert.');
      } else {
        const tagsArray = tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean);

        // Simple non-cryptographic hash string to satisfy NOT NULL requirement
        const submissionHash = `${englishText.trim().toLowerCase()}|${tangkhulText.trim().toLowerCase()}|${(category || 'general').trim().toLowerCase()}|${Date.now()}`;

        const { error: logErr } = await (supabase as any)
          .from('training_submissions_log')
          .insert({
            contributor_id: contributorId,
            english_text: englishText,
            tangkhul_text: tangkhulText,
            category: category || 'general',
            context: context || null,
            tags: tagsArray.length ? tagsArray : null,
            part_of_speech: partOfSpeech || 'unknown',
            grammatical_features: grammaticalFeatures || {},
            submission_hash: submissionHash,
            confidence_score: 85
          });

        if (logErr) {
          console.error('Knowledge log insert failed:', logErr);
        } else {
          console.log('Submission saved to knowledge log');
        }
      }
    } catch (e) {
      console.error('Unexpected error logging submission:', e);
    }

    // Clear form
    setEnglishText("");
    setTangkhulText("");
    setCategory("");
    setContext("");
    setTags("");
    setPartOfSpeech("");
    setGrammaticalFeatures({});

    toast({
      title: "Submitted",
      description: "Your contribution has been submitted and logged to the knowledge base.",
    });
  };

  return (
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
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
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
            <label className="text-sm font-medium">Tags (comma separated)</label>
            <Input
              placeholder="formal, casual, question"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="border-orange-200 focus:border-orange-400"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Part of Speech</label>
            <Select value={partOfSpeech} onValueChange={setPartOfSpeech}>
              <SelectTrigger className="border-orange-200">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verb">Verb</SelectItem>
                <SelectItem value="noun">Noun</SelectItem>
                <SelectItem value="adjective">Adjective</SelectItem>
                <SelectItem value="adverb">Adverb</SelectItem>
                <SelectItem value="phrase">Phrase</SelectItem>
                <SelectItem value="sentence">Sentence</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-sm font-medium">Grammar usage and functions</label>
            <GrammarFeaturesInput
              partOfSpeech={partOfSpeech || 'unknown'}
              value={grammaticalFeatures}
              onChange={setGrammaticalFeatures}
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            💡 Tip: Multiple submissions of the same phrase help determine accuracy through consensus
          </div>
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
            disabled={!englishText.trim() || !tangkhulText.trim() || isLoading}
          >
            <Save className="w-4 h-4 mr-2" />
            Submit Training Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingForm;

