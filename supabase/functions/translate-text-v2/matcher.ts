import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';
import { normalizeText, generateHash, calculateSimilarity } from '../_shared/normalization.ts';
import { calculateConfidence, CONFIDENCE_CONFIG } from '../_shared/confidence.ts';

export interface TranslationResult {
  translated_text: string;
  confidence_score: number;
  method: string;
  alternatives?: Array<{
    text: string;
    confidence: number;
    source: string;
  }>;
  metadata: {
    cached?: boolean;
    submission_count?: number;
    expert_votes?: number;
    is_golden_data?: boolean;
    grammar_info?: any;
  };
}

export async function findTranslation(
  supabaseClient: SupabaseClient,
  sourceText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> {
  const normalizedSource = normalizeText(sourceText);
  const sourceHash = generateHash(normalizedSource);

  // Step 1: Check cache
  const cacheResult = await checkCache(supabaseClient, sourceHash, sourceLang, targetLang);
  if (cacheResult) return cacheResult;

  // Step 2: Exact match on normalized text
  const exactMatch = await findExactMatch(supabaseClient, normalizedSource, sourceLang, targetLang);
  if (exactMatch) {
    await saveToCache(supabaseClient, sourceHash, sourceLang, targetLang, exactMatch);
    return exactMatch;
  }

  // Step 3: Consensus data
  const consensusMatch = await findConsensusMatch(supabaseClient, normalizedSource);
  if (consensusMatch) {
    await saveToCache(supabaseClient, sourceHash, sourceLang, targetLang, consensusMatch);
    return consensusMatch;
  }

  // Step 4: Similarity-based matching using pg_trgm
  const similarMatch = await findSimilarMatches(supabaseClient, normalizedSource, sourceLang, targetLang);
  if (similarMatch) {
    await saveToCache(supabaseClient, sourceHash, sourceLang, targetLang, similarMatch);
    return similarMatch;
  }

  // Step 5: Partial/word-by-word matching
  const partialMatch = await findPartialMatches(supabaseClient, normalizedSource, sourceLang, targetLang);
  if (partialMatch) {
    return partialMatch; // Don't cache partial matches
  }

  // No match found
  throw new Error('No translation found');
}

async function checkCache(
  supabaseClient: SupabaseClient,
  sourceHash: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult | null> {
  const { data, error } = await supabaseClient
    .from('translation_cache')
    .select('*')
    .eq('source_text_hash', sourceHash)
    .eq('source_language', sourceLang)
    .eq('target_language', targetLang)
    .single();

  if (error || !data) return null;

  // Update hit count and last_accessed
  await supabaseClient
    .from('translation_cache')
    .update({ 
      hit_count: data.hit_count + 1,
      last_accessed: new Date().toISOString()
    })
    .eq('id', data.id);

  return {
    translated_text: data.translated_text,
    confidence_score: data.confidence_score,
    method: 'cache_hit',
    metadata: {
      cached: true,
      ...data.metadata
    }
  };
}

async function findExactMatch(
  supabaseClient: SupabaseClient,
  normalizedText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult | null> {
  const sourceField = sourceLang === 'english' ? 'normalized_english' : 'normalized_tangkhul';
  const targetField = targetLang === 'tangkhul' ? 'tangkhul_text' : 'english_text';

  const { data, error } = await supabaseClient
    .from('training_entries')
    .select('*')
    .eq(sourceField, normalizedText)
    .eq('status', 'approved')
    .order('confidence_score', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return {
    translated_text: data[targetField],
    confidence_score: CONFIDENCE_CONFIG.EXACT_MATCH,
    method: 'exact_match',
    metadata: {
      grammar_info: data.grammatical_features
    }
  };
}

async function findConsensusMatch(
  supabaseClient: SupabaseClient,
  normalizedText: string
): Promise<TranslationResult | null> {
  const { data, error } = await supabaseClient
    .from('translation_consensus')
    .select('*')
    .eq('english_text', normalizedText)
    .gte('weighted_agreement_score', 70)
    .order('weighted_agreement_score', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  const confidence = calculateConfidence({
    method: 'consensus',
    submissionCount: data.submission_count,
    expertVotes: data.expert_votes,
    reviewerVotes: data.reviewer_votes,
    contributorVotes: data.contributor_votes,
    isGoldenData: data.is_golden_data
  });

  return {
    translated_text: data.tangkhul_text,
    confidence_score: confidence,
    method: 'consensus',
    metadata: {
      submission_count: data.submission_count,
      expert_votes: data.expert_votes,
      is_golden_data: data.is_golden_data
    }
  };
}

async function findSimilarMatches(
  supabaseClient: SupabaseClient,
  normalizedText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult | null> {
  const sourceField = sourceLang === 'english' ? 'normalized_english' : 'normalized_tangkhul';
  const targetField = targetLang === 'tangkhul' ? 'tangkhul_text' : 'english_text';

  const { data, error } = await supabaseClient
    .from('training_entries')
    .select('*')
    .eq('status', 'approved')
    .gte('confidence_score', 70)
    .limit(10);

  if (error || !data || data.length === 0) return null;

  // Calculate similarity for each entry
  const matches = data
    .map(entry => ({
      ...entry,
      similarity: calculateSimilarity(normalizedText, entry[sourceField])
    }))
    .filter(entry => entry.similarity >= CONFIDENCE_CONFIG.SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);

  if (matches.length === 0) return null;

  const bestMatch = matches[0];
  const confidence = calculateConfidence({
    method: 'similarity',
    similarity: bestMatch.similarity
  });

  const alternatives = matches.slice(1, 4).map(match => ({
    text: match[targetField],
    confidence: Math.round(match.similarity * 100),
    source: 'similarity'
  }));

  return {
    translated_text: bestMatch[targetField],
    confidence_score: confidence,
    method: 'similarity',
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    metadata: {
      grammar_info: bestMatch.grammatical_features
    }
  };
}

async function findPartialMatches(
  supabaseClient: SupabaseClient,
  normalizedText: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult | null> {
  const words = normalizedText.split(/\s+/);
  if (words.length === 1) return null;

  const sourceField = sourceLang === 'english' ? 'normalized_english' : 'normalized_tangkhul';
  const targetField = targetLang === 'tangkhul' ? 'tangkhul_text' : 'english_text';

  const wordMatches: Record<string, string> = {};

  for (const word of words) {
    const { data } = await supabaseClient
      .from('training_entries')
      .select(targetField)
      .eq(sourceField, word)
      .eq('status', 'approved')
      .limit(1)
      .single();

    if (data) {
      wordMatches[word] = data[targetField];
    }
  }

  if (Object.keys(wordMatches).length === 0) return null;

  const translatedWords = words.map(word => wordMatches[word] || word);
  const coverage = Object.keys(wordMatches).length / words.length;

  return {
    translated_text: translatedWords.join(' '),
    confidence_score: Math.round(CONFIDENCE_CONFIG.PARTIAL_MATCH * coverage),
    method: 'partial',
    metadata: {
      coverage
    }
  };
}

async function saveToCache(
  supabaseClient: SupabaseClient,
  sourceHash: string,
  sourceLang: string,
  targetLang: string,
  result: TranslationResult
): Promise<void> {
  await supabaseClient
    .from('translation_cache')
    .upsert({
      source_text_hash: sourceHash,
      source_language: sourceLang,
      target_language: targetLang,
      translated_text: result.translated_text,
      confidence_score: result.confidence_score,
      method: result.method,
      metadata: result.metadata
    });
}
