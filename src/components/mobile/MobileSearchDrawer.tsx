import { useState, useEffect } from "react";
import { Search, X, Clock, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

interface MobileSearchDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onResultSelect?: (result: SearchResult) => void;
}

interface SearchResult {
  id: string;
  english_text: string;
  tangkhul_text: string;
  type: 'cache' | 'consensus' | 'entry';
}

export default function MobileSearchDrawer({ isOpen, onClose, onResultSelect }: MobileSearchDrawerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (query.length >= 2) {
      const timer = setTimeout(() => {
        searchTranslations(query);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
    }
  }, [query]);

  const searchTranslations = async (searchQuery: string) => {
    setLoading(true);
    try {
      const normalizedQuery = searchQuery.toLowerCase().trim();
      
      // Search translation cache
      const { data: cacheData } = await supabase
        .from('translation_cache')
        .select('id, source_text, target_text')
        .or(`source_text.ilike.%${normalizedQuery}%,target_text.ilike.%${normalizedQuery}%`)
        .limit(10);

      // Search consensus
      const { data: consensusData } = await supabase
        .from('translation_consensus')
        .select('id, english_text, tangkhul_text')
        .or(`english_text.ilike.%${normalizedQuery}%,tangkhul_text.ilike.%${normalizedQuery}%`)
        .limit(10);

      const allResults: SearchResult[] = [];
      
      cacheData?.forEach(item => {
        allResults.push({
          id: item.id,
          english_text: item.source_text,
          tangkhul_text: item.target_text,
          type: 'cache'
        });
      });

      consensusData?.forEach(item => {
        // Avoid duplicates
        if (!allResults.find(r => r.english_text === item.english_text)) {
          allResults.push({
            id: item.id,
            english_text: item.english_text,
            tangkhul_text: item.tangkhul_text,
            type: 'consensus'
          });
        }
      });

      setResults(allResults);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    // Save to recent searches
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background"
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border safe-top">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                autoFocus
                placeholder="Search translations..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>

          <ScrollArea className="h-[calc(100vh-80px)]">
            <div className="p-4 space-y-4">
              {/* Recent Searches */}
              {!query && recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Recent Searches</h3>
                    <button 
                      onClick={clearRecentSearches}
                      className="text-xs text-primary"
                    >
                      Clear
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSearch(search)}
                      className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="text-center py-8 text-muted-foreground">
                  Searching...
                </div>
              )}

              {/* Results */}
              {!loading && results.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {results.length} Results
                  </h3>
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center justify-between w-full p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <p className="font-medium truncate">{result.english_text}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {result.tangkhul_text}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}

              {/* No Results */}
              {!loading && query && results.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No translations found for "{query}"
                </div>
              )}

              {/* Empty State */}
              {!query && recentSearches.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Search for translations</p>
                  <p className="text-sm">Type at least 2 characters</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}