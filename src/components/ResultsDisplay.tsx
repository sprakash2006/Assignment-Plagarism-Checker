import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SimilarityResult, Cluster } from '@/types/plagiarism';
import { AlertTriangle, CheckCircle, Users } from 'lucide-react';

interface ResultsDisplayProps {
  similarities: SimilarityResult[];
  clusters: Cluster[];
  documents: Array<{ id: string; name: string }>;
}

export function ResultsDisplay({ similarities, clusters, documents }: ResultsDisplayProps) {
  const getDocName = (docId: string) => {
    return documents.find(d => d.id === docId)?.name || docId;
  };

  const getSeverityColor = (similarity: number) => {
    if (similarity >= 80) return 'text-destructive';
    if (similarity >= 60) return 'text-warning';
    return 'text-success';
  };

  const getSeverityBadge = (similarity: number) => {
    if (similarity >= 80) return 'destructive';
    if (similarity >= 60) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Clusters Section */}
      {clusters.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Detected Clusters</h2>
            <Badge variant="default">{clusters.length}</Badge>
          </div>
          <p className="text-muted-foreground mb-6">
            Groups of documents with high similarity (≥80%) detected using DFS graph traversal
          </p>
          
          <div className="space-y-4">
            {clusters.map((cluster) => (
              <div
                key={cluster.id}
                className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">Cluster #{cluster.id + 1}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cluster.documents.length} documents • Avg Similarity: {cluster.avgSimilarity.toFixed(1)}%
                    </p>
                  </div>
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {cluster.documents.map(docId => (
                    <Badge key={docId} variant="destructive">
                      {getDocName(docId)}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Similarity Matrix */}
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Pairwise Similarity Analysis</h2>
        <p className="text-muted-foreground mb-6">
          Computed using Rabin-Karp, Edit Distance (DP), and Shingling algorithms
        </p>
        
        <div className="space-y-3">
          {similarities
            .sort((a, b) => b.similarity - a.similarity)
            .map((sim, index) => (
              <div
                key={index}
                className="p-4 bg-card border rounded-lg hover:shadow-soft transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="font-medium">
                      {sim.doc1Name} ↔ {sim.doc2Name}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={getSeverityBadge(sim.similarity)}>
                      {sim.similarity.toFixed(1)}% similar
                    </Badge>
                    {sim.similarity >= 80 && <AlertTriangle className="w-5 h-5 text-destructive" />}
                    {sim.similarity < 60 && <CheckCircle className="w-5 h-5 text-success" />}
                  </div>
                </div>
                
                {/* Similarity bar */}
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getSeverityColor(sim.similarity)} bg-current transition-all`}
                    style={{ width: `${sim.similarity}%` }}
                  />
                </div>
                
                {sim.matchedSections.length > 0 && (
                  <div className="mt-3 p-3 bg-secondary rounded text-sm">
                    <strong>Matched section:</strong> {sim.matchedSections[0]}
                  </div>
                )}
              </div>
            ))}
        </div>
      </Card>

      {/* Algorithm Info */}
      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">DSA Algorithms Used:</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• <strong>Rabin-Karp:</strong> Rolling hash for substring matching - O(n+m)</li>
          <li>• <strong>Edit Distance:</strong> Dynamic Programming - O(m×n) with 2D array</li>
          <li>• <strong>Shingling + HashMap:</strong> K-word chunks with O(1) lookups</li>
          <li>• <strong>Graph (Adjacency List):</strong> Similarity connections</li>
          <li>• <strong>DFS:</strong> Connected components for clustering - O(V+E)</li>
          <li>• <strong>HashSet:</strong> Stopword filtering - O(1) lookup</li>
        </ul>
      </Card>
    </div>
  );
}
