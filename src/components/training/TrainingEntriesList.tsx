import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Star, Wifi } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface TrainingEntry {
  id: string;
  english_text: string;
  tangkhul_text: string;
  category_id: string | null;
  is_golden_data: boolean | null;
  confidence_score: number | null;
  review_count: number | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  };
  training_categories?: {
    name: string;
  };
}

interface TrainingEntriesListProps {
  entries: TrainingEntry[];
  onEntriesUpdate?: (entries: TrainingEntry[]) => void;
}

const TrainingEntriesList = ({ entries: initialEntries, onEntriesUpdate }: TrainingEntriesListProps) => {
  const [entries, setEntries] = useState<TrainingEntry[]>(initialEntries);
  const [isLive, setIsLive] = useState(false);
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  useEffect(() => {
    const channel = supabase
      .channel('training-entries-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'training_entries'
        },
        async (payload) => {
          // Fetch the full entry with relations
          const { data: newEntry } = await supabase
            .from('training_entries')
            .select(`
              *,
              profiles!training_entries_contributor_id_fkey (full_name),
              training_categories (name)
            `)
            .eq('id', payload.new.id)
            .single();

          if (newEntry) {
            setEntries(prev => [newEntry as TrainingEntry, ...prev.slice(0, 49)]);
            setNewEntryIds(prev => new Set([...prev, payload.new.id]));
            onEntriesUpdate?.([newEntry as TrainingEntry, ...entries.slice(0, 49)]);
            
            // Remove highlight after 3 seconds
            setTimeout(() => {
              setNewEntryIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(payload.new.id);
                return newSet;
              });
            }, 3000);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'training_entries'
        },
        (payload) => {
          setEntries(prev => 
            prev.map(entry => 
              entry.id === payload.new.id 
                ? { ...entry, ...payload.new } as TrainingEntry
                : entry
            )
          );
        }
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onEntriesUpdate]);

  const getConfidenceDisplay = (score: number | null) => {
    if (score === null) return null;
    const percent = score <= 1 ? Math.round(score * 100) : Math.round(score);
    return percent;
  };

  return (
    <Card className="glass border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <BookOpen className="w-5 h-5 text-primary" />
          Recent Community Contributions ({entries.length})
          {isLive && (
            <Badge variant="outline" className="ml-auto text-success border-success animate-pulse">
              <Wifi className="w-3 h-3 mr-1" />
              Live
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {entries.map((entry) => (
              <motion.div 
                key={entry.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  backgroundColor: newEntryIds.has(entry.id) ? 'hsl(var(--primary) / 0.1)' : 'transparent'
                }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="border border-border rounded-lg p-4 bg-surface/50"
              >
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">English</label>
                    <p className="font-medium text-foreground">{entry.english_text}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground uppercase">Tangkhul</label>
                    <p className="font-medium text-primary">{entry.tangkhul_text}</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {entry.training_categories?.name && (
                    <Badge variant="outline" className="border-primary/30">
                      {entry.training_categories.name}
                    </Badge>
                  )}
                  {entry.is_golden_data && (
                    <Badge className="bg-accent/20 text-accent border-accent/30">
                      <Star className="w-3 h-3 mr-1" />
                      Golden Data
                    </Badge>
                  )}
                  {getConfidenceDisplay(entry.confidence_score) !== null && (
                    <Badge variant="outline" className={
                      getConfidenceDisplay(entry.confidence_score)! >= 90 ? "border-success/50 text-success" :
                      getConfidenceDisplay(entry.confidence_score)! >= 75 ? "border-warning/50 text-warning" :
                      "border-destructive/50 text-destructive"
                    }>
                      {getConfidenceDisplay(entry.confidence_score)}% confidence
                    </Badge>
                  )}
                  {entry.review_count !== null && entry.review_count > 0 && (
                    <Badge variant="secondary">
                      {entry.review_count} reviews
                    </Badge>
                  )}
                </div>
                
                <div className="text-xs text-muted-foreground mt-2">
                  By {entry.profiles?.full_name || 'Anonymous'} • {new Date(entry.created_at).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrainingEntriesList;
