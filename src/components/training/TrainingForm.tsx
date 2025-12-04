import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Save, WifiOff, Cloud } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import GrammarFeaturesInput from "./GrammarFeaturesInput";
import { toast } from "@/hooks/use-toast";
import { useOfflineQueue } from '@/hooks/useOfflineQueue';

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
  
  const { isOnline, addToQueue, queueLength } = useOfflineQueue();

  useEffect(() => {
    loadCategories();
    
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
      
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories([
          { id: 'greetings', name: 'greetings' },
          { id: 'expressions', name: 'expressions' },
          { id: 'numbers', name: 'numbers' },
          { id: 'colors', name: 'colors' },
          { id: 'family', name: 'family' },
          { id: 'food', name: 'food' },
          { id: 'nature', name: 'nature' },
          { id: 'time', name: 'time' },
          { id: 'directions', name: 'directions' },
          { id: 'emotions', name: 'emotions' }
        ]);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories([
        { id: 'greetings', name: 'greetings' },
        { id: 'expressions', name: 'expressions' },
        { id: 'numbers', name: 'numbers' }
      ]);
    }
  };

  const handleSubmit = async () => {
    if (!englishText.trim() || !tangkhulText.trim()) return;

    if (!isOnline) {
      addToQueue({
        english_text: englishText.trim(),
        tangkhul_text: tangkhulText.trim(),
        category_id: category || undefined,
        is_golden_data: false
      });

      setEnglishText("");
      setTangkhulText("");
      setCategory("");
      setContext("");
      setTags("");
      setPartOfSpeech("");
      setGrammaticalFeatures({});

      toast({
        title: "Saved Offline",
        description: "Your contribution will sync when you're back online.",
      });
      return;
    }

    onSubmit({
      englishText,
      tangkhulText,
      category: category || "general",
      context,
      tags,
      partOfSpeech: partOfSpeech || 'unknown'
    });

    try {
      const { data: userRes } = await supabase.auth.getUser();
      const contributorId = userRes?.user?.id;
      if (!contributorId) {
        console.warn('User not authenticated, skipping knowledge log insert.');
      } else {
        // Find category_id from categories
        const selectedCategory = categories.find(c => c.name === category || c.id === category);
        const categoryId = selectedCategory?.id;

        // Build grammar features with extra info
        const fullGrammarFeatures = {
          ...grammaticalFeatures,
          part_of_speech: partOfSpeech || 'unknown',
          tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        };

        const { error: logErr } = await supabase
          .from('training_submissions_log')
          .insert({
            contributor_id: contributorId,
            english_text: englishText.trim(),
            tangkhul_text: tangkhulText.trim(),
            category_id: categoryId && categoryId.length === 36 ? categoryId : null,
            linguistic_notes: context || null,
            grammar_features: fullGrammarFeatures,
            is_golden_data: false
          });

        if (logErr) {
          console.error('Knowledge log insert failed:', logErr);
          toast({
            title: "Submission Failed",
            description: logErr.message,
            variant: "destructive"
          });
          return;
        }
      }
    } catch (e) {
      console.error('Unexpected error logging submission:', e);
    }

    setEnglishText("");
    setTangkhulText("");
    setCategory("");
    setContext("");
    setTags("");
    setPartOfSpeech("");
    setGrammaticalFeatures({});

    toast({
      title: "Submitted",
      description: "Your contribution has been submitted successfully.",
    });
  };

  return (
    <Card className="glass border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-foreground text-base sm:text-lg">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Contribute Training Data
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isOnline && (
              <Badge variant="outline" className="text-warning border-warning text-xs">
                <WifiOff className="w-3 h-3 mr-1" />
                Offline
              </Badge>
            )}
            {queueLength > 0 && (
              <Badge variant="secondary" className="text-xs">
                <Cloud className="w-3 h-3 mr-1" />
                {queueLength} pending
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Your contributions help build the AI model.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">English Text</label>
            <Textarea
              placeholder="Enter English text..."
              value={englishText}
              onChange={(e) => setEnglishText(e.target.value)}
              className="border-border focus:border-primary min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Tangkhul Translation</label>
            <Textarea
              placeholder="Enter accurate Tangkhul translation..."
              value={tangkhulText}
              onChange={(e) => setTangkhulText(e.target.value)}
              className="border-border focus:border-primary min-h-[80px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="border-border w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Context/Usage</label>
            <Textarea
              placeholder="When and how is this used?"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="border-border focus:border-primary min-h-[40px]"
            />
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
            <label className="text-sm font-medium text-foreground">Tags (comma separated)</label>
            <Input
              placeholder="formal, casual, question"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="border-border focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Part of Speech</label>
            <Select value={partOfSpeech} onValueChange={setPartOfSpeech}>
              <SelectTrigger className="border-border w-full">
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
          <div className="sm:col-span-1 lg:col-span-2 space-y-2">
            <label className="text-sm font-medium text-foreground">Grammar Features</label>
            <GrammarFeaturesInput
              partOfSpeech={partOfSpeech || 'unknown'}
              value={grammaticalFeatures}
              onChange={setGrammaticalFeatures}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="text-xs sm:text-sm text-muted-foreground">
            💡 Multiple submissions help determine accuracy
          </div>
          <Button 
            onClick={handleSubmit}
            className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90"
            disabled={!englishText.trim() || !tangkhulText.trim() || isLoading}
          >
            {isOnline ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Submit
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 mr-2" />
                Save Offline
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingForm;