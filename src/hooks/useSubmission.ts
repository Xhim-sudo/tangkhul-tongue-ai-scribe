import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useOfflineQueue } from './useOfflineQueue';

interface SubmissionData {
  englishText: string;
  tangkhulText: string;
  categoryId?: string | null;
  linguisticNotes?: string;
  grammarFeatures?: Record<string, any>;
}

interface UserStats {
  totalContributions: number;
  goldenCount: number;
  streak: number;
}

interface Category {
  id: string;
  name: string;
}

const DRAFT_KEY = 'tangkhul_form_draft';

const retryWithBackoff = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const msg = error?.message || '';
      const isRetryable = msg.includes('terminating connection') ||
        msg.includes('connection timeout') ||
        msg.includes('ECONNREFUSED');
      if (!isRetryable || attempt === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000));
    }
  }
  throw new Error('Max retries reached');
};

export const useSubmission = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({ totalContributions: 0, goldenCount: 0, streak: 0 });
  const [statsLoading, setStatsLoading] = useState(true);
  const { isOnline, addToQueue, queueLength, syncing, syncQueue } = useOfflineQueue();

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadUserStats(); }, []);

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const { data } = await supabase.from('training_categories').select('id, name').order('name');
      if (data && data.length > 0) {
        setCategories(data);
      } else {
        setCategories([
          { id: 'general', name: 'General' },
          { id: 'greetings', name: 'Greetings' },
          { id: 'food', name: 'Food & Drink' },
          { id: 'family', name: 'Family' },
          { id: 'numbers', name: 'Numbers' },
          { id: 'directions', name: 'Directions' },
        ]);
      }
    } catch {
      setCategories([
        { id: 'general', name: 'General' },
        { id: 'greetings', name: 'Greetings' },
      ]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadUserStats = async () => {
    setStatsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatsLoading(false); return; }

      const [totalRes, goldenRes] = await Promise.all([
        supabase.from('training_submissions_log')
          .select('id', { count: 'exact', head: true })
          .eq('contributor_id', user.id),
        supabase.from('training_submissions_log')
          .select('id', { count: 'exact', head: true })
          .eq('contributor_id', user.id)
          .eq('is_golden_data', true),
      ]);

      // Simple streak calc
      const { data: recentSubs } = await supabase
        .from('training_submissions_log')
        .select('created_at')
        .eq('contributor_id', user.id)
        .gte('created_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .order('created_at', { ascending: false });

      let streak = 0;
      if (recentSubs && recentSubs.length > 0) {
        const days = new Set(recentSubs.map(s => s.created_at.slice(0, 10)));
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() - i);
          if (days.has(d.toISOString().slice(0, 10))) {
            streak++;
          } else if (i > 0) break;
        }
      }

      setUserStats({
        totalContributions: totalRes.count || 0,
        goldenCount: goldenRes.count || 0,
        streak,
      });
    } catch {
      // silent fail
    } finally {
      setStatsLoading(false);
    }
  };

  const submitEntry = useCallback(async (data: SubmissionData): Promise<boolean> => {
    if (!data.englishText.trim() || !data.tangkhulText.trim()) {
      toast({ title: "Missing fields", description: "Please fill in both English and Tangkhul text", variant: "destructive" });
      return false;
    }

    if (!isOnline) {
      addToQueue({
        english_text: data.englishText.trim(),
        tangkhul_text: data.tangkhulText.trim(),
        category_id: data.categoryId || undefined,
        is_golden_data: false,
      });
      toast({ title: "Saved Offline", description: "Your contribution will sync when you're back online." });
      clearDraft();
      return true;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not authenticated", description: "Please log in to submit.", variant: "destructive" });
        return false;
      }

      const isValidUUID = data.categoryId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.categoryId);

      const result = await retryWithBackoff(async () => {
        const res = await supabase.from('training_submissions_log').insert({
          contributor_id: user.id,
          english_text: data.englishText.trim(),
          tangkhul_text: data.tangkhulText.trim(),
          category_id: isValidUUID ? data.categoryId! : null,
          linguistic_notes: data.linguisticNotes || null,
          grammar_features: data.grammarFeatures || null,
          is_golden_data: false,
        });
        if (res.error) throw res.error;
        return res;
      });

      if (result.error) {
        toast({ title: "Submission failed", description: result.error.message, variant: "destructive" });
        return false;
      }

      toast({ title: "Success!", description: "Your contribution has been submitted." });
      clearDraft();
      loadUserStats();
      return true;
    } catch (error: any) {
      addToQueue({
        english_text: data.englishText.trim(),
        tangkhul_text: data.tangkhulText.trim(),
        category_id: data.categoryId || undefined,
        is_golden_data: false,
      });
      toast({ title: "Connection issue", description: "Saved locally. Will sync when connection is restored." });
      clearDraft();
      return true;
    } finally {
      setIsSubmitting(false);
    }
  }, [isOnline, addToQueue]);

  const saveDraft = useCallback((draft: Partial<SubmissionData>) => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch {}
  }, []);

  const loadDraft = useCallback((): Partial<SubmissionData> | null => {
    try {
      const stored = localStorage.getItem(DRAFT_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  }, []);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  }, []);

  return {
    submitEntry, isSubmitting, categories, categoriesLoading,
    userStats, statsLoading, isOnline, queueLength, syncing, syncQueue,
    saveDraft, loadDraft, clearDraft,
  };
};
