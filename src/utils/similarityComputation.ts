import { createShingles, editDistance, longestCommonSubstring } from './textProcessing';
import { SimilarityResult } from '@/types/plagiarism';

/**
 * Compute Jaccard Similarity using HashSet
 * DSA Concepts: HashSet, Set operations
 * Time Complexity: O(n + m) where n, m are set sizes
 */
function jaccardSimilarity(shingles1: string[], shingles2: string[]): number {
  const set1 = new Set(shingles1);
  const set2 = new Set(shingles2);
  
  // Intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Union
  const union = new Set([...set1, ...set2]);
  
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Compute similarity using multiple algorithms
 * Combines: Shingling + Jaccard, Edit Distance, LCS
 */
export function computeSimilarity(
  doc1Content: string,
  doc2Content: string
): number {
  // Method 1: Shingling + Jaccard (HashMap-based)
  const shingles1 = createShingles(doc1Content, 3);
  const shingles2 = createShingles(doc2Content, 3);
  const jaccardScore = jaccardSimilarity(shingles1, shingles2);
  
  // Method 2: Edit Distance (DP-based)
  // Use first 500 chars to avoid performance issues
  const sample1 = doc1Content.substring(0, 500);
  const sample2 = doc2Content.substring(0, 500);
  const maxLen = Math.max(sample1.length, sample2.length);
  const editDist = editDistance(sample1, sample2);
  const editScore = maxLen === 0 ? 0 : 1 - (editDist / maxLen);
  
  // Method 3: Longest Common Substring
  // Cap LCS computation to avoid O(m*n) on huge documents
  const lcs = longestCommonSubstring(doc1Content, doc2Content, 1000);
  const denom = Math.min(doc1Content.length, doc2Content.length, 1000);
  const lcsScore = denom === 0 ? 0 : lcs.length / denom;
  
  // Weighted combination
  return (jaccardScore * 0.5) + (editScore * 0.3) + (lcsScore * 0.2);
}

/**
 * Compute all pairwise similarities
 * Returns similarity matrix as array of results
 */
export function computeAllSimilarities(
  documents: Array<{ id: string; name: string; content: string }>
): SimilarityResult[] {
  const results: SimilarityResult[] = [];
  
  // Precompute shingles for all documents to avoid recomputation
  const preShingles = documents.map(d => createShingles(d.content, 3));
  const wordCounts = documents.map(d => d.content.split(/\s+/).filter(Boolean).length || 0);

  for (let i = 0; i < documents.length; i++) {
    for (let j = i + 1; j < documents.length; j++) {
      // Fast path: if both have no shingles, similarity is 0
      const s1 = preShingles[i];
      const s2 = preShingles[j];
      const jaccardScore = jaccardSimilarity(s1, s2);

      // Compute common shingles count (intersection)
      const set1 = new Set(s1);
      const set2 = new Set(s2);
      let commonCount = 0;
      for (const sh of set1) if (set2.has(sh)) commonCount++;

      // Average word count of the two documents (avoid zero)
      const avgWords = Math.max(1, Math.floor((wordCounts[i] + wordCounts[j]) / 2));

      // New metric: (no_of_similar_shingles / avg_no_of_words) * 100
      const matchMetric = (commonCount / avgWords) * 100;

      // Also compute legacy composite score for reference if needed
      let compositeScore = jaccardScore;
      if (jaccardScore > 0.15) {
        const sample1 = documents[i].content.substring(0, 500);
        const sample2 = documents[j].content.substring(0, 500);
        const maxLen = Math.max(sample1.length, sample2.length);
        const editDist = editDistance(sample1, sample2);
        const editScore = maxLen === 0 ? 0 : 1 - (editDist / maxLen);

        const lcs = longestCommonSubstring(documents[i].content, documents[j].content, 800);
        const denom = Math.min(documents[i].content.length, documents[j].content.length, 800);
        const lcsScore = denom === 0 ? 0 : lcs.length / denom;

        compositeScore = (jaccardScore * 0.5) + (editScore * 0.3) + (lcsScore * 0.2);
      }

      // Include some matchedSections if we have a meaningful LCS
      const matchedSections: string[] = [];
      if (matchMetric >= 5) {
        const lcsVerbose = longestCommonSubstring(documents[i].content, documents[j].content, 2000);
        if (lcsVerbose.length > 50) matchedSections.push(lcsVerbose.substring(0, 200) + '...');
      }

      results.push({
        doc1Id: documents[i].id,
        doc2Id: documents[j].id,
        doc1Name: documents[i].name,
        doc2Name: documents[j].name,
        similarity: matchMetric, // Use new match-based metric as primary percentage
        matchedSections,
        rawMatchCount: commonCount,
        avgWords,
        matchMetric,
        compositeScore: compositeScore * 100
      });
    }
  }
  
  return results;
}
