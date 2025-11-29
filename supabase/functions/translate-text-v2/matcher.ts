import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

export interface TranslationResult {
  translated_text: string | null;
  confidence_score: number;
  method: string;
  found: boolean;
  alternatives?: Array<{
    text: string;
    confidence: number;
    source: string;
  }>;
  metadata: {
    cached?: boolean;
    submission_count?: number;
    is_golden_data?: boolean;
  };
}

// Normalize text for comparison
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

// Simple similarity calculation
function calculateSimilarity(text1: string, text2: string): number {
  const s1 = normalizeText(text1);
  const s2 = normalizeText(text2);
  
  if (s1 === s2) return 1;
  
  const words1 = s1.split(' ');
  const words2 = s2.split(' ');
  const commonWords = words1.filter(w => words2.includes(w));
  
  return commonWords.length / Math.max(words1.length, words2.length);
}

export async function findTranslation(
  supabaseClient: SupabaseClient,
  sourceText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  const normalizedSource = normalizeText(sourceText);
  
  console.log(`Looking up translation for: "${sourceText}" (${sourceLang} → ${targetLang})`);

  // Step 1: Check cache first
  const cacheResult = await checkCache(supabaseClient, normalizedSource, sourceLang, targetLang);
  if (cacheResult) {
    console.log('Cache hit!');
    return cacheResult;
  }

  // Step 2: Exact match in training_entries
  const exactMatch = await findExactMatch(supabaseClient, normalizedSource, sourceLang, targetLang);
  if (exactMatch) {
    console.log('Exact match found in training_entries');
    await saveToCache(supabaseClient, normalizedSource, sourceLang, targetLang, exactMatch);
    return exactMatch;
  }

  // Step 3: Check consensus data
  const consensusMatch = await findConsensusMatch(supabaseClient, normalizedSource, sourceLang, targetLang);
  if (consensusMatch) {
    console.log('Consensus match found');
    await saveToCache(supabaseClient, normalizedSource, sourceLang, targetLang, consensusMatch);
    return consensusMatch;
  }

  // Step 4: Similarity-based matching
  const similarMatch = await findSimilarMatches(supabaseClient, normalizedSource, sourceLang, targetLang);
  if (similarMatch) {
    console.log('Similar match found');
    return similarMatch;
  }

  // No match found - return graceful response
  console.log('No translation found');
  return {
    translated_text: null,
    confidence_score: 0,
    method: 'not_found',
    found: false,
    metadata: {}
  };
}

async function checkCache(
  supabaseClient: SupabaseClient,
  normalizedText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult | null> {
  try {
    const { data, error } = await supabaseClient
      .from('translation_cache')
      .select('*')
      .eq('source_text', normalizedText)
      .eq('source_lang', sourceLang)
      .eq('target_lang', targetLang)
      .single();

    if (error || !data) return null;

    // Update hit count
    await supabaseClient
      .from('translation_cache')
      .update({ 
        hit_count: (data.hit_count || 0) + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', data.id);

    return {
      translated_text: data.target_text,
      confidence_score: data.confidence_score || 85,
      method: 'cache',
      found: true,
      metadata: {
        cached: true
      }
    };
  } catch (err) {
    console.error('Cache lookup error:', err);
    return null;
  }
}

async function findExactMatch(
  supabaseClient: SupabaseClient,
  normalizedText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult | null> {
  try {
    const isEnglishSource = sourceLang === 'english' || sourceLang === 'en';
    const sourceField = isEnglishSource ? 'english_text' : 'tangkhul_text';
    const targetField = isEnglishSource ? 'tangkhul_text' : 'english_text';

    // Try exact match first
    const { data, error } = await supabaseClient
      .from('training_entries')
      .select('*')
      .ilike(sourceField, normalizedText)
      .order('confidence_score', { ascending: false, nullsFirst: false })
      .limit(1);

    if (error) {
      console.error('Exact match query error:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const match = data[0];
    return {
      translated_text: match[targetField],
      confidence_score: match.confidence_score || 90,
      method: 'exact',
      found: true,
      metadata: {
        is_golden_data: match.is_golden_data
      }
    };
  } catch (err) {
    console.error('Exact match error:', err);
    return null;
  }
}

async function findConsensusMatch(
  supabaseClient: SupabaseClient,
  normalizedText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult | null> {
  try {
    const isEnglishSource = sourceLang === 'english' || sourceLang === 'en';
    const sourceField = isEnglishSource ? 'english_text' : 'tangkhul_text';
    const targetField = isEnglishSource ? 'tangkhul_text' : 'english_text';

    const { data, error } = await supabaseClient
      .from('translation_consensus')
      .select('*')
      .ilike(sourceField, normalizedText)
      .gte('agreement_score', 70)
      .order('agreement_score', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Consensus query error:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const match = data[0];
    return {
      translated_text: match[targetField],
      confidence_score: Math.round(match.agreement_score),
      method: 'consensus',
      found: true,
      metadata: {
        submission_count: match.submission_count,
        is_golden_data: match.is_golden_data
      }
    };
  } catch (err) {
    console.error('Consensus match error:', err);
    return null;
  }
}

async function findSimilarMatches(
  supabaseClient: SupabaseClient,
  normalizedText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult | null> {
  try {
    const isEnglishSource = sourceLang === 'english' || sourceLang === 'en';
    const sourceField = isEnglishSource ? 'english_text' : 'tangkhul_text';
    const targetField = isEnglishSource ? 'tangkhul_text' : 'english_text';

    // Get entries to compare
    const { data, error } = await supabaseClient
      .from('training_entries')
      .select('*')
      .order('confidence_score', { ascending: false, nullsFirst: false })
      .limit(50);

    if (error) {
      console.error('Similar match query error:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    // Calculate similarity for each entry
    const matches = data
      .map(entry => ({
        ...entry,
        similarity: calculateSimilarity(normalizedText, entry[sourceField] || '')
      }))
      .filter(entry => entry.similarity >= 0.6)
      .sort((a, b) => b.similarity - a.similarity);

    if (matches.length === 0) return null;

    const bestMatch = matches[0];
    const confidence = Math.round(bestMatch.similarity * (bestMatch.confidence_score || 80));

    const alternatives = matches.slice(1, 4).map(match => ({
      text: match[targetField],
      confidence: Math.round(match.similarity * 100),
      source: 'similarity'
    }));

    return {
      translated_text: bestMatch[targetField],
      confidence_score: confidence,
      method: 'similarity',
      found: true,
      alternatives: alternatives.length > 0 ? alternatives : undefined,
      metadata: {
        is_golden_data: bestMatch.is_golden_data
      }
    };
  } catch (err) {
    console.error('Similar match error:', err);
    return null;
  }
}

async function saveToCache(
  supabaseClient: SupabaseClient,
  normalizedText: string,
  sourceLang: string,
  targetLang: string,
  result: TranslationResult
): Promise<void> {
  try {
    await supabaseClient
      .from('translation_cache')
      .upsert({
        source_text: normalizedText,
        source_lang: sourceLang,
        target_lang: targetLang,
        target_text: result.translated_text,
        confidence_score: result.confidence_score,
        hit_count: 1,
        last_used_at: new Date().toISOString()
      }, {
        onConflict: 'source_text,source_lang,target_lang'
      });
  } catch (err) {
    console.error('Cache save error:', err);
  }
}
