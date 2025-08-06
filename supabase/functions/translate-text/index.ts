import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Enhanced text similarity calculation with word overlap
function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const words1 = str1.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  const words2 = str2.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 0);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Calculate word overlap similarity
  const commonWords = words1.filter(word => words2.includes(word));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  
  return similarity;
}

// Enhanced matching with grammatical awareness
function findBestMatches(inputText: string, trainingData: any[], sourceField: string, targetField: string, minSimilarity: number = 0.4): any[] {
  const inputWordCount = inputText.trim().split(/\s+/).length;
  
  const matches = trainingData
    .map(entry => {
      const similarity = calculateSimilarity(inputText, entry[sourceField]);
      
      // Boost confidence for exact word count matches and similar parts of speech
      let confidence = similarity;
      if (entry.word_count === inputWordCount) confidence += 0.1;
      if (entry.is_phrase === (inputWordCount > 1)) confidence += 0.1;
      if (entry.usage_frequency === 'very_common') confidence += 0.05;
      
      return {
        ...entry,
        similarity,
        confidence: Math.min(confidence, 1.0)
      };
    })
    .filter(entry => entry.similarity >= minSimilarity)
    .sort((a, b) => b.confidence - a.confidence);

  return matches.slice(0, 5); // Return top 5 matches
}

// Extract words with basic normalization
function extractWords(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 0);
}

// Enhanced word-level matching with part-of-speech awareness
function findWordMatches(inputText: string, trainingData: any[], sourceField: string, targetField: string): { [key: string]: string[] } {
  const inputWords = extractWords(inputText);
  const wordMatches: { [key: string]: string[] } = {};

  inputWords.forEach(word => {
    // Find exact word matches, prioritizing by part of speech and frequency
    const exactMatches = trainingData
      .filter(entry => 
        entry.word_count === 1 && 
        extractWords(entry[sourceField]).includes(word)
      )
      .sort((a, b) => {
        // Prioritize by usage frequency and confidence
        const freqA = a.usage_frequency === 'very_common' ? 3 : a.usage_frequency === 'common' ? 2 : 1;
        const freqB = b.usage_frequency === 'very_common' ? 3 : b.usage_frequency === 'common' ? 2 : 1;
        return freqB - freqA;
      });
    
    if (exactMatches.length > 0) {
      wordMatches[word] = exactMatches.slice(0, 3).map(match => match[targetField]);
    }
  });

  return wordMatches;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Health check endpoint
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ 
        status: 'healthy', 
        service: 'translate-text',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError.message 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { text, source_language = 'english', target_language = 'tangkhul' } = requestBody;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Valid text is required',
          received: typeof text,
          value: text 
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with error handling
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test database connection
    const { data: healthCheck, error: healthError } = await supabase
      .from('training_entries')
      .select('count')
      .limit(1);

    if (healthError) {
      console.error('Database connection error:', healthError);
      return new Response(
        JSON.stringify({ 
          error: 'Database connection failed',
          details: healthError.message 
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch approved training data with enhanced fields
    const { data: trainingData, error: fetchError } = await supabase
      .from('training_entries')
      .select('*, part_of_speech, difficulty_level, usage_frequency, is_phrase, word_count')
      .eq('status', 'approved')
      .order('usage_frequency', { ascending: false });

    if (fetchError) {
      console.error('Error fetching training data:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch training data',
          details: fetchError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!trainingData || trainingData.length === 0) {
      return new Response(
        JSON.stringify({
          translated_text: text,
          confidence_score: 0,
          method: 'no_data',
          message: 'No training data available. Please contribute translations to improve the system.',
          suggestions: [],
          metadata: {
            input_word_count: text.trim().split(/\s+/).length,
            available_entries: 0
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Translation request: "${text}" (${source_language} → ${target_language})`);
    console.log(`Available training entries: ${trainingData.length}`);

    // Determine source and target fields based on language direction
    const sourceField = source_language === 'english' ? 'english_text' : 'tangkhul_text';
    const targetField = target_language === 'tangkhul' ? 'tangkhul_text' : 'english_text';

    const inputWordCount = text.trim().split(/\s+/).length;
    const isInputPhrase = inputWordCount > 1;

    // Step 1: Try exact match first (case-insensitive)
    const exactMatch = trainingData.find(entry => 
      entry[sourceField].toLowerCase().trim() === text.toLowerCase().trim()
    );

    if (exactMatch) {
      console.log(`Exact match found: "${exactMatch[sourceField]}" → "${exactMatch[targetField]}"`);
      return new Response(
        JSON.stringify({
          translated_text: exactMatch[targetField],
          confidence_score: 98,
          method: 'exact_match',
          message: 'Found exact match in training data',
          metadata: {
            category: exactMatch.category,
            part_of_speech: exactMatch.part_of_speech,
            difficulty: exactMatch.difficulty_level,
            frequency: exactMatch.usage_frequency
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 2: Try enhanced similarity-based matching with grammar awareness
    const similarMatches = findBestMatches(text, trainingData, sourceField, targetField, 0.6);
    
    if (similarMatches.length > 0) {
      const bestMatch = similarMatches[0];
      const confidence = Math.round(bestMatch.confidence * 85); // Scale to realistic confidence
      
      console.log(`Similarity match found: "${bestMatch[sourceField]}" → "${bestMatch[targetField]}" (${confidence}%)`);
      
      return new Response(
        JSON.stringify({
          translated_text: bestMatch[targetField],
          confidence_score: confidence,
          method: 'similarity_match',
          message: `Found similar phrase with ${confidence}% confidence`,
          alternative_translations: similarMatches.slice(1, 3).map(match => ({
            text: match[targetField],
            confidence: Math.round(match.confidence * 85),
            source: match[sourceField],
            category: match.category,
            part_of_speech: match.part_of_speech
          })),
          metadata: {
            category: bestMatch.category,
            part_of_speech: bestMatch.part_of_speech,
            similarity_score: Math.round(bestMatch.similarity * 100)
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 3: Enhanced word-by-word matching for partial translation
    const wordMatches = findWordMatches(text, trainingData, sourceField, targetField);
    const matchedWords = Object.keys(wordMatches);
    
    if (matchedWords.length > 0) {
      const inputWords = text.split(/\s+/);
      const partialTranslation = inputWords.map(word => {
        const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
        if (wordMatches[normalizedWord] && wordMatches[normalizedWord].length > 0) {
          return wordMatches[normalizedWord][0];
        }
        return `[${word}]`; // Untranslated words in brackets
      }).join(' ');

      const confidence = Math.round((matchedWords.length / inputWords.length) * 70);
      
      console.log(`Partial match: ${matchedWords.length}/${inputWords.length} words translated`);

      return new Response(
        JSON.stringify({
          translated_text: partialTranslation,
          confidence_score: confidence,
          method: 'partial_match',
          message: `Partial translation: ${matchedWords.length} out of ${inputWords.length} words translated`,
          word_matches: wordMatches,
          untranslated_words: inputWords.filter(word => {
            const normalizedWord = word.toLowerCase().replace(/[^\w]/g, '');
            return !wordMatches[normalizedWord];
          }),
          suggestions: [
            `Consider contributing the complete phrase: "${text}"`,
            `Help add missing words to improve partial translations`
          ],
          metadata: {
            coverage_percentage: Math.round((matchedWords.length / inputWords.length) * 100),
            word_count: inputWords.length,
            matched_words: matchedWords.length
          }
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Step 4: No match found - provide helpful suggestions
    const lowSimilarityMatches = findBestMatches(text, trainingData, sourceField, targetField, 0.2);
    
    console.log(`No matches found for: "${text}"`);
    
    return new Response(
      JSON.stringify({
        translated_text: text,
        confidence_score: 0,
        method: 'no_match',
        message: 'No translation found. Please contribute this translation to improve the system.',
        suggestions: [
          ...lowSimilarityMatches.slice(0, 3).map(match => ({
            text: `Similar: "${match[sourceField]}" → "${match[targetField]}"`,
            similarity: Math.round(match.similarity * 100),
            category: match.category,
            suggestion_type: 'similar_phrase'
          })),
          {
            text: `Contribute: Add "${text}" to help others`,
            suggestion_type: 'contribution_prompt'
          }
        ],
        metadata: {
          input_analysis: {
            word_count: inputWordCount,
            is_phrase: isInputPhrase,
            language_pair: `${source_language} → ${target_language}`
          },
          database_stats: {
            total_entries: trainingData.length,
            phrases: trainingData.filter(e => e.is_phrase).length,
            words: trainingData.filter(e => !e.is_phrase).length
          }
        }
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in translate-text function:', error);
    console.error('Stack trace:', error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: 'Translation service temporarily unavailable', 
        message: 'Please try again in a moment',
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});