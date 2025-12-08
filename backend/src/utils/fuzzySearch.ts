/**
 * Fuzzy search utilities for typo-tolerant searching
 * Uses Levenshtein distance to find similar strings
 */

/**
 * Calculate Levenshtein distance between two strings
 * Returns the minimum number of single-character edits needed to transform one string into another
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  
  // Create a matrix
  const matrix: number[][] = [];
  
  // Initialize first row and column
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,     // deletion
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j - 1] + 1  // substitution
        );
      }
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0 to 1, where 1 is identical)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();
  
  if (s1 === s2) return 1;
  
  const maxLen = Math.max(s1.length, s2.length);
  if (maxLen === 0) return 1;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

/**
 * Check if two strings are similar enough (above threshold)
 * @param str1 First string
 * @param str2 Second string
 * @param threshold Similarity threshold (0 to 1), default 0.6 (60% similar)
 */
export function isSimilar(str1: string, str2: string, threshold: number = 0.6): boolean {
  return calculateSimilarity(str1, str2) >= threshold;
}

/**
 * Find best matches in an array of strings using fuzzy search
 * @param searchTerm The search term
 * @param candidates Array of candidate strings to search
 * @param threshold Similarity threshold (0 to 1), default 0.6
 * @param maxResults Maximum number of results to return
 */
export function findFuzzyMatches(
  searchTerm: string,
  candidates: string[],
  threshold: number = 0.6,
  maxResults: number = 50
): Array<{ text: string; similarity: number }> {
  if (!searchTerm || !candidates || candidates.length === 0) {
    return [];
  }
  
  const results: Array<{ text: string; similarity: number }> = [];
  
  for (const candidate of candidates) {
    if (!candidate) continue;
    
    const similarity = calculateSimilarity(searchTerm, candidate);
    if (similarity >= threshold) {
      results.push({ text: candidate, similarity });
    }
  }
  
  // Sort by similarity (highest first)
  results.sort((a, b) => b.similarity - a.similarity);
  
  // Return top results
  return results.slice(0, maxResults);
}

/**
 * Check if search term matches any field in dealer object using fuzzy search
 * @param searchTerm The search term
 * @param dealer Dealer object with searchable fields
 * @param threshold Similarity threshold (0 to 1), default 0.5 (lowered for better typo tolerance)
 */
export function fuzzyMatchDealer(
  searchTerm: string,
  dealer: {
    companyName: string | null;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    buyingGroup: string | null;
    groups?: string; // Optional: comma-separated group names
  },
  threshold: number = 0.5
): boolean {
  if (!searchTerm) return false;
  
  const searchTermLower = searchTerm.toLowerCase().trim();
  
  // Check each field individually to know which field we're checking
  const fieldsToCheck = [
    { value: dealer.companyName, isName: true },
    { value: dealer.contactName, isName: true },
    { value: dealer.email, isName: false },
    { value: dealer.phone, isName: false },
    { value: dealer.buyingGroup, isName: false },
    { value: dealer.groups || null, isName: false }
  ];
  
  for (const { value: field, isName } of fieldsToCheck) {
    if (!field) continue;
    
    const fieldLower = field.toLowerCase().trim();
    
    // Check full field match
    if (isSimilar(searchTermLower, fieldLower, threshold)) {
      return true;
    }
    
    // For name fields, also check word-by-word matching
    // This helps with "Skulnick" matching "Donna Skolnick" or "Steve Skolnick"
    if (isName) {
      const words = fieldLower.split(/\s+/);
      for (const word of words) {
        // Check if search term matches any word (both must be at least 3 chars for meaningful match)
        if (word.length >= 3 && searchTermLower.length >= 3) {
          if (isSimilar(searchTermLower, word, threshold)) {
            return true;
          }
        }
      }
    }
  }
  
  return false;
}

