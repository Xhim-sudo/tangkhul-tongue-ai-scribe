
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper functions for text similarity and matching
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 100;
  
  // Levenshtein distance calculation
  const matrix = Array(s2.length + 1).fill(null).map(() => Array(s1.length + 1).fill(null));
  
  for (let i = 0; i <= s1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= s2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= s2.length; j++) {
    for (let i = 1; i <= s1.length; i++) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 100 : Math.round((1 - matrix[s2.length][s1.length] / maxLength) * 100);
}

function findBestMatches(inputText: string, trainingData: any[], sourceField: string, targetField: string, minSimilarity = 60) {
  const matches = trainingData.map(item => ({
    ...item,
    similarity: calculateSimilarity(inputText, item[sourceField])
  }))
  .filter(item => item.similarity >= minSimilarity)
  .sort((a, b) => b.similarity - a.similarity);
  
  return matches;
}

function extractWords(text: string): string[] {
  return text.toLowerCase().match(/\w+/g) || [];
}

function findWordMatches(inputText: string, trainingData: any[], sourceField: string, targetField: string) {
  const inputWords = extractWords(inputText);
  const wordTranslations: { [key: string]: string[] } = {};
  
  trainingData.forEach(item => {
    const sourceWords = extractWords(item[sourceField]);
    const targetWords = extractWords(item[targetField]);
    
    sourceWords.forEach((word, index) => {
      if (inputWords.includes(word) && targetWords[index]) {
        if (!wordTranslations[word]) wordTranslations[word] = [];
        if (!wordTranslations[word].includes(targetWords[index])) {
          wordTranslations[word].push(targetWords[index]);
        }
      }
    });
  });
  
  return wordTranslations;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, source_language, target_language } = await req.json();
    
    if (!text || !source_language || !target_language) {
      return new Response(JSON.stringify({ 
        error: "Missing required parameters",
        translated_text: "Please provide text and language parameters.",
        confidence_score: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);
    
    console.log('Attempting database-first translation...');
    
    // Get all approved training data for translation
    const { data: trainingData, error: dbError } = await supabase
      .from('training_entries')
      .select('english_text, tangkhul_text, category, context')
      .eq('status', 'approved');

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(JSON.stringify({ 
        error: "Database connection error",
        translated_text: "Unable to access translation database. Please try again later.",
        confidence_score: 0
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!trainingData || trainingData.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No training data available",
        translated_text: "Translation database is empty. Please contribute training data to enable translations.",
        confidence_score: 0,
        suggestion: "This translation is not available yet. Would you like to contribute it to our database?"
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sourceField = source_language === 'english' ? 'english_text' : 'tangkhul_text';
    const targetField = source_language === 'english' ? 'tangkhul_text' : 'english_text';
    
    // Step 1: Try exact match
    const exactMatch = trainingData.find(item => 
      item[sourceField].toLowerCase().trim() === text.toLowerCase().trim()
    );
    
    if (exactMatch) {
      console.log('Exact match found');
      return new Response(JSON.stringify({ 
        translated_text: exactMatch[targetField],
        confidence_score: 95,
        source_language,
        target_language,
        method: 'exact_match'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Step 2: Try similarity matching
    const similarMatches = findBestMatches(text, trainingData, sourceField, targetField, 80);
    
    if (similarMatches.length > 0) {
      console.log('High similarity match found:', similarMatches[0].similarity);
      return new Response(JSON.stringify({ 
        translated_text: similarMatches[0][targetField],
        confidence_score: Math.max(similarMatches[0].similarity - 10, 60),
        source_language,
        target_language,
        method: 'similarity_match',
        alternatives: similarMatches.slice(1, 3).map(m => ({
          text: m[targetField],
          confidence: m.similarity - 15
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Step 3: Try word-by-word matching for partial translations
    const wordMatches = findWordMatches(text, trainingData, sourceField, targetField);
    const inputWords = extractWords(text);
    const translatedWords = inputWords.map(word => {
      if (wordMatches[word] && wordMatches[word].length > 0) {
        return wordMatches[word][0]; // Use most common translation
      }
      return `[${word}]`; // Mark untranslated words
    });
    
    if (Object.keys(wordMatches).length > 0) {
      console.log('Partial word matches found');
      const partialTranslation = translatedWords.join(' ');
      const coveragePercent = Math.round((Object.keys(wordMatches).length / inputWords.length) * 100);
      
      return new Response(JSON.stringify({ 
        translated_text: partialTranslation,
        confidence_score: Math.min(coveragePercent, 50),
        source_language,
        target_language,
        method: 'partial_match',
        coverage: `${Object.keys(wordMatches).length}/${inputWords.length} words`,
        suggestion: "This is a partial translation. Words in [brackets] need translation. Would you like to contribute the complete translation?"
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Step 4: No matches found - suggest contribution
    const lowerSimilarMatches = findBestMatches(text, trainingData, sourceField, targetField, 40);
    
    return new Response(JSON.stringify({ 
      translated_text: "Translation not available in our database yet.",
      confidence_score: 0,
      source_language,
      target_language,
      method: 'no_match',
      suggestion: "This translation is not available yet. Would you like to contribute it to our database?",
      similar_phrases: lowerSimilarMatches.slice(0, 3).map(m => ({
        source: m[sourceField],
        target: m[targetField],
        similarity: m.similarity
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Translation error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      translated_text: "Translation service temporarily unavailable. Please try again later.",
      confidence_score: 0
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
