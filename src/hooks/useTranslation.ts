
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export const useTranslation = () => {
  const [isLoading, setIsLoading] = useState(false);

  const translateText = async (text: string, fromLang: string, toLang: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { 
          text, 
          source_language: fromLang,
          target_language: toLang 
        }
      });

      if (error) throw error;

      // Save translation to history
      const { error: saveError } = await (supabase as any)
        .from('translations')
        .insert({
          source_text: text,
          translated_text: data.translated_text,
          source_language: fromLang,
          target_language: toLang,
          confidence_score: data.confidence_score || 85
        });

      if (saveError) console.error('Failed to save translation:', saveError);

      return data;
    } catch (error: any) {
      toast({
        title: "Translation failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const submitTrainingData = async (englishText: string, tangkhulText: string, category: string, context?: string, tags?: string[]) => {
    try {
      const { error } = await (supabase as any)
        .from('training_entries')
        .insert({
          english_text: englishText,
          tangkhul_text: tangkhulText,
          category,
          context,
          tags,
          contributor_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Training data submitted",
        description: "Your contribution has been added for review.",
      });
    } catch (error: any) {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    translateText,
    submitTrainingData,
    isLoading
  };
};
