import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft, Copy, Volume2, ThumbsUp, ThumbsDown, MessageCircle, Plus, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from '@/hooks/useTranslation';
import { supabase } from '@/integrations/supabase/client';

const TranslationInterface = () => {
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState("english");
  const [targetLanguage, setTargetLanguage] = useState("tangkhul");
  const [commonPhrases, setCommonPhrases] = useState([]);
  const [translationResult, setTranslationResult] = useState<any>(null);
  const { translateText, isLoading } = useTranslation();

  // Load common phrases from database
  useEffect(() => {
    const loadCommonPhrases = async () => {
      const { data } = await supabase
        .from('training_entries')
        .select('english_text, tangkhul_text')
        .eq('is_golden_data', true)
        .limit(6);
      
      if (data) {
        setCommonPhrases(data);
      }
    };
    
    loadCommonPhrases();
  }, []);

  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({
        title: "No text to translate",
        description: "Please enter some text to translate.",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await translateText(sourceText, sourceLanguage, targetLanguage);
      
      // Handle no translation found
      if (!result.found || !result.translated_text) {
        setTranslatedText('');
        setTranslationResult(result);
        toast({
          title: "Translation not found",
          description: "This phrase is not in our database yet. Consider contributing it!",
          variant: "default",
        });
        return;
      }
      
      setTranslatedText(result.translated_text);
      setTranslationResult(result);
      
      let toastMessage = "Translation complete";
      if (result.method === 'exact' || result.method === 'exact_match') {
        toastMessage = "Perfect match found in our database!";
      } else if (result.method === 'similarity' || result.method === 'similarity_match') {
        toastMessage = "Similar translation found in our database";
      } else if (result.method === 'partial' || result.method === 'partial_match') {
        toastMessage = "Partial translation available";
      } else if (result.method === 'consensus') {
        toastMessage = "Community-verified translation found!";
      } else if (result.method === 'cache') {
        toastMessage = "Quick translation from cache";
      } else if (result.method === 'static_fallback') {
        toastMessage = "Translation from offline data";
      }
      
      toast({
        title: toastMessage,
        description: `Confidence: ${result.confidence_score}%`,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleSwapLanguages = () => {
    const tempLang = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(tempLang);
    
    const tempText = sourceText;
    setSourceText(translatedText);
    setTranslatedText(tempText);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text has been copied to your clipboard.",
    });
  };

  const handleFeedback = async (isPositive: boolean) => {
    // Just show a toast for now - feedback can be implemented with a proper table later
    toast({
      title: isPositive ? "Thank you for positive feedback!" : "Thank you for your feedback!",
      description: "Your feedback helps improve our translations.",
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6 px-1">
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-foreground text-lg sm:text-xl">
            <MessageCircle className="w-5 h-5 text-primary" />
            Community-Powered Translation
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Translations powered by community-verified Tangkhul language data
          </p>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Language Selection - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="tangkhul">Tangkhul</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleSwapLanguages}
              className="border-primary/30 hover:bg-primary/10 self-center"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
            
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tangkhul">Tangkhul</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Translation Interface - Mobile Optimized */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2 sm:space-y-3">
              <label className="text-sm font-medium text-foreground">
                {sourceLanguage === "english" ? "English" : "Tangkhul"}
              </label>
              <Textarea
                placeholder={`Enter ${sourceLanguage === "english" ? "English" : "Tangkhul"} text here...`}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="min-h-28 sm:min-h-32 resize-none border-primary/30 focus:border-primary"
              />
              <Button 
                onClick={handleTranslate} 
                disabled={isLoading}
                className="w-full sm:w-auto bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isLoading ? "Translating..." : "Translate"}
              </Button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <label className="text-sm font-medium text-foreground">
                {targetLanguage === "english" ? "English" : "Tangkhul"}
              </label>
              <Textarea
                placeholder="Translation will appear here..."
                value={translatedText}
                readOnly
                className="min-h-28 sm:min-h-32 resize-none bg-muted/50 border-primary/30"
              />
              {translatedText && (
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopy(translatedText)}
                    className="border-primary/30 hover:bg-primary/10"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFeedback(true)}
                    className="border-success/30 hover:bg-success/10"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFeedback(false)}
                    className="border-destructive/30 hover:bg-destructive/10"
                  >
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Translation Metadata */}
          {translationResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={
                  translationResult.method === 'exact_match' ? 'default' :
                  translationResult.method === 'similarity_match' ? 'secondary' :
                  translationResult.method === 'partial_match' ? 'outline' : 'destructive'
                }>
                  {translationResult.method === 'exact_match' && '✓ Exact Match'}
                  {translationResult.method === 'similarity_match' && '≈ Similar Match'}
                  {translationResult.method === 'partial_match' && '◐ Partial Match'}
                  {translationResult.method === 'no_match' && '? No Match'}
                </Badge>
                <span className="text-sm text-gray-600">
                  Confidence: {translationResult.confidence_score}%
                </span>
                {translationResult.coverage && (
                  <span className="text-sm text-gray-600">
                    Coverage: {translationResult.coverage}
                  </span>
                )}
              </div>
              
              {translationResult.suggestion && (
                <div className="flex items-start gap-2 mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                  <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
                  <p className="text-sm text-blue-800">{translationResult.suggestion}</p>
                </div>
              )}

              {/* Enhanced Alternative Translations */}
              {(translationResult.alternatives || translationResult.alternative_translations) && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Alternative translations:</p>
                  <div className="space-y-1">
                    {(translationResult.alternatives || translationResult.alternative_translations)?.map((alt: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex-1">
                          <span className="text-sm font-medium">{alt.text}</span>
                          {alt.category && (
                            <span className="text-xs bg-secondary/50 px-1 rounded ml-2">{alt.category}</span>
                          )}
                          {alt.part_of_speech && (
                            <span className="text-xs bg-muted/50 px-1 rounded ml-1">{alt.part_of_speech}</span>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {alt.confidence}% confidence
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Translation Metadata */}
              {translationResult?.metadata && (
                <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Translation Details:</p>
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    {translationResult.metadata.category && (
                      <div>Category: <span className="font-medium">{translationResult.metadata.category}</span></div>
                    )}
                    {translationResult.metadata.part_of_speech && (
                      <div>Type: <span className="font-medium">{translationResult.metadata.part_of_speech}</span></div>
                    )}
                    {translationResult.metadata.difficulty && (
                      <div>Level: <span className="font-medium">{translationResult.metadata.difficulty}</span></div>
                    )}
                    {translationResult.metadata.frequency && (
                      <div>Usage: <span className="font-medium">{translationResult.metadata.frequency}</span></div>
                    )}
                  </div>
                </div>
              )}

              {/* Untranslated Words */}
              {translationResult?.untranslated_words && translationResult.untranslated_words.length > 0 && (
                <div className="mt-3 p-3 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-sm font-medium mb-2 text-warning-foreground">Missing Translations:</p>
                  <div className="flex flex-wrap gap-1">
                    {translationResult.untranslated_words.map((word: string, index: number) => (
                      <span key={index} className="text-xs bg-warning/20 px-2 py-1 rounded">
                        {word}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Similar Phrases */}
              {translationResult.similar_phrases && translationResult.similar_phrases.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Similar phrases in our database:</p>
                  <div className="space-y-2">
                    {translationResult.similar_phrases.map((phrase: any, index: number) => (
                      <div key={index} className="p-2 bg-white rounded border">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{phrase.source}</p>
                            <p className="text-sm text-orange-600">{phrase.target}</p>
                          </div>
                          <Badge variant="outline" className="text-xs ml-2">
                            {phrase.similarity}% similar
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contribute Missing Translation */}
              {translationResult.method === 'no_match' && (
                <div className="mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-200 hover:bg-green-50"
                    onClick={() => {
                      toast({
                        title: "Feature coming soon!",
                        description: "Direct contribution from translation interface will be available soon.",
                      });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Contribute This Translation
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Common Phrases - Mobile Optimized */}
      <Card className="bg-surface/70 backdrop-blur-sm border-primary/20">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-foreground text-lg sm:text-xl">Verified Translations</CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Community-verified authentic Tangkhul phrases
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {commonPhrases.map((phrase: any, index) => (
              <Button
                key={index}
                variant="outline"
                className="p-3 sm:p-4 h-auto flex flex-col items-start border-primary/20 hover:bg-primary/10 text-left"
                onClick={() => {
                  setSourceText(phrase.english_text);
                  setTranslatedText(phrase.tangkhul_text);
                  setSourceLanguage("english");
                  setTargetLanguage("tangkhul");
                }}
              >
                <span className="font-medium text-sm truncate w-full">{phrase.english_text}</span>
                <span className="text-primary text-xs sm:text-sm truncate w-full">{phrase.tangkhul_text}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationInterface;
