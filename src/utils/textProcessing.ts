// DSA: HashSet for O(1) stopword lookup
const STOPWORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
  'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
  'to', 'was', 'will', 'with', 'this', 'but', 'they', 'have', 'had',
  'what', 'when', 'where', 'who', 'which', 'why', 'how'
]);

// Common PDF/internal tokens that frequently appear in many PDF files
// and can cause false-positive similarities (e.g., "endobj", "stream")
const PDF_TOKENS = [
  'endobj', 'obj', 'stream', 'endstream', 'xref', 'trailer', 'flatedecode',
  'filter', 'length', 'id', 'type', 'subtype', 'image', 'colorspace', 'bitspercomponent',
  'decode', 'width', 'height'
];

for (const t of PDF_TOKENS) STOPWORDS.add(t);

/**
 * Preprocess text using HashSet for efficient stopword removal
 * DSA Concepts: HashSet, String manipulation
 * Time Complexity: O(n) where n is number of words
 */
export function preprocessText(text: string): string {
  if (!text) return '';

  // Heuristic: detect PDF/binary-like content
  const looksLikePDF = /%PDF|endobj|stream|FlateDecode/i.test(text);
  // Ratio of non-printable characters
  const nonPrintableMatches = text.match(/[^\x20-\x7E\s]/g) || [];
  const nonPrintableRatio = text.length > 0 ? nonPrintableMatches.length / text.length : 0;

  let cleaned = text;

  if (looksLikePDF || nonPrintableRatio > 0.2) {
    // Remove common PDF structural tokens
    const pdfTokenRegex = new RegExp(PDF_TOKENS.join('|'), 'gi');
    cleaned = cleaned.replace(pdfTokenRegex, ' ');

    // Remove binary/non-printable ranges (keep printable ASCII and whitespace)
    cleaned = cleaned.replace(/[^\x20-\x7E\s]+/g, ' ');
  }

  return cleaned
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOPWORDS.has(word)) // O(1) lookup
    .join(' ');
}

/**
 * Create shingles (k-word chunks) from text
 * DSA Concepts: Sliding window, Array/Vector
 * Time Complexity: O(n) where n is number of words
 */
export function createShingles(text: string, k: number = 3): string[] {
  const words = text.split(/\s+/);
  const shingles: string[] = [];

  for (let i = 0; i <= words.length - k; i++) {
    shingles.push(words.slice(i, i + k).join(' '));
  }

  return shingles;
}

/**
 * Rabin-Karp rolling hash implementation
 * DSA Concepts: Rolling hash, String matching
 * Time Complexity: O(n + m) for pattern matching
 */
export function rabinKarpHash(str: string, prime: number = 101): number {
  let hash = 0;
  const base = 256;
  
  for (let i = 0; i < str.length; i++) {
    hash = (hash * base + str.charCodeAt(i)) % prime;
  }
  
  return hash;
}

/**
 * Find all pattern matches using Rabin-Karp algorithm
 * DSA Concepts: Rolling hash, String matching, HashMap
 */
export function rabinKarpSearch(text: string, pattern: string): number[] {
  const matches: number[] = [];
  const prime = 101;
  const base = 256;
  const m = pattern.length;
  const n = text.length;
  
  if (m > n) return matches;
  
  let patternHash = rabinKarpHash(pattern, prime);
  let textHash = rabinKarpHash(text.substring(0, m), prime);
  let h = Math.pow(base, m - 1) % prime;
  
  for (let i = 0; i <= n - m; i++) {
    if (patternHash === textHash) {
      if (text.substring(i, i + m) === pattern) {
        matches.push(i);
      }
    }
    
    if (i < n - m) {
      // Rolling hash computation
      textHash = (base * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % prime;
      if (textHash < 0) textHash += prime;
    }
  }
  
  return matches;
}

/**
 * Compute Edit Distance using Dynamic Programming
 * DSA Concepts: 2D DP array, Dynamic Programming
 * Time Complexity: O(m * n)
 * Space Complexity: O(m * n)
 */
export function editDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Create 2D DP array
  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  
  // Initialize base cases
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill DP table
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // Deletion
          dp[i][j - 1],     // Insertion
          dp[i - 1][j - 1]  // Substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Find Longest Common Substring using Dynamic Programming
 * DSA Concepts: 2D DP array, Suffix-based matching
 * Time Complexity: O(m * n)
 */
/**
 * Find Longest Common Substring using Dynamic Programming
 * Accepts optional maxChars to cap the computation for very large inputs
 */
export function longestCommonSubstring(str1: string, str2: string, maxChars: number = 2000): string {
  // Limit the strings to the first maxChars characters to bound time/space
  const s1 = str1.length > maxChars ? str1.substring(0, maxChars) : str1;
  const s2 = str2.length > maxChars ? str2.substring(0, maxChars) : str2;

  const m = s1.length;
  const n = s2.length;

  const dp: number[][] = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));
  let maxLength = 0;
  let endIndex = 0;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {

      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
        if (dp[i][j] > maxLength) {
          maxLength = dp[i][j];
          endIndex = i;
        }
      }
    }
  }

  return s1.substring(endIndex - maxLength, endIndex);
}
