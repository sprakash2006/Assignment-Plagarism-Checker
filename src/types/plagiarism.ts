export interface UploadedDocument {
  id: string;
  name: string;
  content: string;
  uploadedAt: Date;
}

export interface SimilarityResult {
  doc1Id: string;
  doc2Id: string;
  doc1Name: string;
  doc2Name: string;
  // primary similarity used for thresholding (percentage)
  similarity: number;
  matchedSections: string[];
  // New optional fields for match-based metric
  rawMatchCount?: number; // number of common shingles
  avgWords?: number; // average word count of the two documents
  matchMetric?: number; // rawMatchCount normalized by avgWords (0..100)
  compositeScore?: number; // previous weighted score (percentage)
}

export interface Cluster {
  id: number;
  documents: string[];
  avgSimilarity: number;
}

export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  cluster: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  similarity: number;
}
