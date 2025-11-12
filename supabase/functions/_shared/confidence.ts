/**
 * Confidence scoring configuration
 */
export const CONFIDENCE_CONFIG = {
  EXACT_MATCH: 100,
  CACHE_HIT: 100,
  CONSENSUS_HIGH: 95,
  CONSENSUS_MEDIUM: 85,
  SIMILARITY_THRESHOLD: 0.8,
  SIMILARITY_BASE: 75,
  PARTIAL_MATCH: 60,
  FALLBACK: 40,
  
  // Weights for different factors
  WEIGHTS: {
    EXPERT_VOTE: 3.0,
    REVIEWER_VOTE: 2.0,
    CONTRIBUTOR_VOTE: 1.0,
    GRAMMAR_MATCH: 1.2,
    FREQUENCY: 1.1,
  }
};

/**
 * Calculate confidence score based on method and metadata
 */
export function calculateConfidence(params: {
  method: string;
  similarity?: number;
  submissionCount?: number;
  expertVotes?: number;
  reviewerVotes?: number;
  contributorVotes?: number;
  grammarMatch?: boolean;
  isGoldenData?: boolean;
}): number {
  const {
    method,
    similarity = 0,
    submissionCount = 0,
    expertVotes = 0,
    reviewerVotes = 0,
    contributorVotes = 0,
    grammarMatch = false,
    isGoldenData = false,
  } = params;

  let baseScore = 0;

  switch (method) {
    case 'cache_hit':
      baseScore = CONFIDENCE_CONFIG.CACHE_HIT;
      break;
    
    case 'exact_match':
      baseScore = CONFIDENCE_CONFIG.EXACT_MATCH;
      break;
    
    case 'consensus':
      // Calculate weighted consensus
      const totalWeightedVotes = 
        expertVotes * CONFIDENCE_CONFIG.WEIGHTS.EXPERT_VOTE +
        reviewerVotes * CONFIDENCE_CONFIG.WEIGHTS.REVIEWER_VOTE +
        contributorVotes * CONFIDENCE_CONFIG.WEIGHTS.CONTRIBUTOR_VOTE;
      
      const maxPossibleWeight = submissionCount * CONFIDENCE_CONFIG.WEIGHTS.EXPERT_VOTE;
      const agreementRatio = maxPossibleWeight > 0 ? totalWeightedVotes / maxPossibleWeight : 0;
      
      if (agreementRatio >= 0.9) {
        baseScore = CONFIDENCE_CONFIG.CONSENSUS_HIGH;
      } else if (agreementRatio >= 0.7) {
        baseScore = CONFIDENCE_CONFIG.CONSENSUS_MEDIUM;
      } else {
        baseScore = CONFIDENCE_CONFIG.SIMILARITY_BASE;
      }
      break;
    
    case 'similarity':
      // Scale similarity score
      baseScore = CONFIDENCE_CONFIG.SIMILARITY_BASE + (similarity * 20);
      break;
    
    case 'partial':
      baseScore = CONFIDENCE_CONFIG.PARTIAL_MATCH;
      break;
    
    default:
      baseScore = CONFIDENCE_CONFIG.FALLBACK;
  }

  // Apply bonuses
  let finalScore = baseScore;
  
  if (grammarMatch) {
    finalScore *= CONFIDENCE_CONFIG.WEIGHTS.GRAMMAR_MATCH;
  }
  
  if (isGoldenData) {
    finalScore = Math.max(finalScore, CONFIDENCE_CONFIG.CONSENSUS_HIGH);
  }

  // Cap at 100
  return Math.min(Math.round(finalScore), 100);
}
