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
      const { data } = await (supabase as any)
        .from('training_entries')
        .select('english_text, tangkhul_text')
        .eq('status', 'approved')
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
      setTranslatedText(result.translated_text);
      setTranslationResult(result);
      
      let toastMessage = "Translation complete";
      if (result.method === 'exact_match') {
        toastMessage = "Perfect match found in our database!";
      } else if (result.method === 'similarity_match') {
        toastMessage = "Similar translation found in our database";
      } else if (result.method === 'partial_match') {
        toastMessage = "Partial translation available";
      } else if (result.method === 'no_match') {
        toastMessage = "Translation not available yet";
      }
      
      toast({
        title: toastMessage,
        description: result.suggestion || "Translation based on our training data.",
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
    if (translatedText) {
      const { error } = await (supabase as any)
        .from('translations')
        .update({ feedback_rating: isPositive ? 5 : 1 })
        .eq('source_text', sourceText)
        .eq('translated_text', translatedText);

      if (!error) {
        toast({
          title: isPositive ? "Thank you for positive feedback!" : "Thank you for your feedback!",
          description: "Your feedback helps improve our AI translation model.",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <MessageCircle className="w-5 h-5" />
            Community-Powered Translation
          </CardTitle>
          <p className="text-sm text-gray-600">
            Translations powered by community-verified Tangkhul language data
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language Selection */}
          <div className="flex items-center gap-4">
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger className="w-40">
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
              className="border-orange-200 hover:bg-orange-50"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </Button>
            
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tangkhul">Tangkhul</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Translation Interface */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                {sourceLanguage === "english" ? "English" : "Tangkhul"}
              </label>
              <Textarea
                placeholder={`Enter ${sourceLanguage === "english" ? "English" : "Tangkhul"} text here...`}
                value={sourceText}
                onChange={(e) => setSourceText(e.target.value)}
                className="min-h-32 resize-none border-orange-200 focus:border-orange-400"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleTranslate} 
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                >
                  {isLoading ? "Translating..." : "Translate with AI"}
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">
                {targetLanguage === "english" ? "English" : "Tangkhul"}
              </label>
              <Textarea
                placeholder="AI translation will appear here..."
                value={translatedText}
                readOnly
                className="min-h-32 resize-none bg-gray-50 border-orange-200"
              />
              {translatedText && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopy(translatedText)}
                    className="border-orange-200 hover:bg-orange-50"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFeedback(true)}
                    className="border-green-200 hover:bg-green-50"
                  >
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleFeedback(false)}
                    className="border-red-200 hover:bg-red-50"
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

              {/* Alternative Translations */}
              {translationResult.alternatives && translationResult.alternatives.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Alternative translations:</p>
                  <div className="space-y-1">
                    {translationResult.alternatives.map((alt: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                        <span className="text-sm">{alt.text}</span>
                        <Badge variant="outline" className="text-xs">
                          {alt.confidence}% confidence
                        </Badge>
                      </div>
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

      {/* Common Phrases */}
      <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">Verified Translations</CardTitle>
          <p className="text-sm text-gray-600">
            Community-verified authentic Tangkhul phrases
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {commonPhrases.map((phrase: any, index) => (
              <Button
                key={index}
                variant="outline"
                className="p-4 h-auto flex flex-col items-start border-orange-200 hover:bg-orange-50"
                onClick={() => {
                  setSourceText(phrase.english_text);
                  setTranslatedText(phrase.tangkhul_text);
                  setSourceLanguage("english");
                  setTargetLanguage("tangkhul");
                }}
              >
                <span className="font-medium">{phrase.english_text}</span>
                <span className="text-orange-600 text-sm">{phrase.tangkhul_text}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationInterface;
