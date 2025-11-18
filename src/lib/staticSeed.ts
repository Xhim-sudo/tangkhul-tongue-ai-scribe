// Static fallback seed data for offline/emergency translation
export const STATIC_SEED_DATA: Record<string, string> = {
  // Greetings
  'hello': 'Ngala',
  'good morning': 'Ngala yawui',
  'good evening': 'Ngala khatui',
  'how are you': 'Khonui phung',
  'i am fine': 'Kaphung',
  'thank you': 'Kazo',
  'goodbye': 'Khathei',
  'please': 'Arum',
  'sorry': 'Kamarei',
  'yes': 'Ho',
  'no': 'Mai',
  
  // Numbers
  'one': 'Khat',
  'two': 'Kani',
  'three': 'Kathum',
  'four': 'Mali',
  'five': 'Manga',
  'six': 'Taruk',
  'seven': 'Nishini',
  'eight': 'Kashet',
  'nine': 'Kaikui',
  'ten': 'Kashira',
  
  // Family
  'father': 'Pa',
  'mother': 'Nui',
  'brother': 'Nanao',
  'sister': 'Nasha',
  'friend': 'Khuirei',
  'child': 'Nao',
  
  // Emergency
  'help': 'Ringshim',
  'doctor': 'Vaiphei',
  'hospital': 'Hospital',
  'i am sick': 'Ka rei',
  'water': 'Tui',
  'food': 'Chara',
  
  // Common
  'where': 'Kharei',
  'what': 'Kara',
  'when': 'Katara',
  'how': 'Khanao',
  'i': 'Ka',
  'you': 'Nang'
};

export function staticSeedLookup(text: string): string | null {
  const normalized = text.toLowerCase().trim();
  return STATIC_SEED_DATA[normalized] || null;
}
