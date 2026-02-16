import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OfflineEntry {
  id: string;
  english_text: string;
  tangkhul_text: string;
  category_id?: string;
  is_golden_data: boolean;
  timestamp: number;
}

const OFFLINE_QUEUE_KEY = 'tangkhul_offline_queue';
const OFFLINE_CACHE_KEY = 'tangkhul_translation_cache';

export const useOfflineQueue = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueLength, setQueueLength] = useState(0);
  const [syncing, setSyncing] = useState(false);

  // Update online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Syncing your contributions...');
      syncQueue();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You\'re offline. Contributions will be saved locally.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check queue on mount
    const queue = getQueue();
    setQueueLength(queue.length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getQueue = (): OfflineEntry[] => {
    try {
      const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveQueue = (queue: OfflineEntry[]) => {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    setQueueLength(queue.length);
  };

  const addToQueue = useCallback((entry: Omit<OfflineEntry, 'id' | 'timestamp'>) => {
    const queue = getQueue();
    const newEntry: OfflineEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    queue.push(newEntry);
    saveQueue(queue);
    
    // Also cache for offline translation
    cacheTranslation(entry.english_text, entry.tangkhul_text);
    
    return newEntry.id;
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    const queue = getQueue();
    const filtered = queue.filter(e => e.id !== id);
    saveQueue(filtered);
  }, []);

  const syncQueue = useCallback(async () => {
    if (syncing || !navigator.onLine) return;

    const queue = getQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    let syncedCount = 0;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to sync your contributions');
        setSyncing(false);
        return;
      }

      for (const entry of queue) {
        try {
          const isValidUUID = entry.category_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entry.category_id);
          const { error } = await supabase
            .from('training_submissions_log')
            .insert({
              english_text: entry.english_text,
              tangkhul_text: entry.tangkhul_text,
              category_id: isValidUUID ? entry.category_id : null,
              is_golden_data: entry.is_golden_data,
              contributor_id: user.id,
            });

          if (!error) {
            removeFromQueue(entry.id);
            syncedCount++;
          }
        } catch (err) {
          // skip failed entries, will retry next sync
        }
      }

      if (syncedCount > 0) {
        toast.success(`Synced ${syncedCount} offline contributions!`);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  }, [syncing, removeFromQueue]);

  // Translation cache for offline use
  const cacheTranslation = (english: string, tangkhul: string) => {
    try {
      const cache = getTranslationCache();
      cache[english.toLowerCase().trim()] = tangkhul;
      localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(cache));
    } catch (err) {
      console.error('Failed to cache translation:', err);
    }
  };

  const getTranslationCache = (): Record<string, string> => {
    try {
      const stored = localStorage.getItem(OFFLINE_CACHE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  };

  const getOfflineTranslation = useCallback((english: string): string | null => {
    const cache = getTranslationCache();
    return cache[english.toLowerCase().trim()] || null;
  }, []);

  // Pre-cache common translations
  const preCacheTranslations = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      const { data } = await supabase
        .from('training_submissions_log')
        .select('english_text, tangkhul_text')
        .eq('is_golden_data', true)
        .limit(200);

      if (data) {
        data.forEach(entry => {
          cacheTranslation(entry.english_text, entry.tangkhul_text);
        });
        toast.success(`Cached ${data.length} translations for offline use`);
      }
    } catch (err) {
      console.error('Failed to pre-cache translations:', err);
    }
  }, []);

  return {
    isOnline,
    queueLength,
    syncing,
    addToQueue,
    syncQueue,
    getOfflineTranslation,
    preCacheTranslations,
    getQueue
  };
};
