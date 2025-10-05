import { useState } from 'react';
import { FileUploader } from '@/components/FileUploader';
import { ResultsDisplay } from '@/components/ResultsDisplay';
import { ClusterVisualization } from '@/components/ClusterVisualization';
import { preprocessText } from '@/utils/textProcessing';
import { computeAllSimilarities } from '@/utils/similarityComputation';
import { createClusters, createGraphData } from '@/utils/clustering';
import { SimilarityResult, Cluster, GraphNode, GraphEdge } from '@/types/plagiarism';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, TrendingUp, Network } from 'lucide-react';
import { toast } from 'sonner';

interface ProcessedDocument {
  id: string;
  name: string;
  content: string;
}

const Index = () => {
  const [documents, setDocuments] = useState<ProcessedDocument[]>([]);
  const [similarities, setSimilarities] = useState<SimilarityResult[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [graphData, setGraphData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFilesProcessed = async (files: ProcessedDocument[]) => {
    setIsProcessing(true);
    toast.info('Processing documents with DSA algorithms...');

    try {
      // Step 1: Preprocess text (HashSet stopwords)
      const processedDocs = files.map(file => ({
        ...file,
        content: preprocessText(file.content)
      }));
      setDocuments(processedDocs);
      // Offload heavy computation to a web worker when possible
      let simResults;
      let clusterResults;
      let graphResults;

      if (typeof Worker !== 'undefined') {
        // Dynamic import path for Vite; ensure worker file exists
        try {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore - bundlers may rewrite this import for worker-loader
          const worker = new Worker(new URL('../workers/analysis.worker.ts', import.meta.url), { type: 'module' });

          const workerPromise: Promise<any> = new Promise((resolve, reject) => {
            worker.addEventListener('message', (ev) => {
              const { similarities, clusters, graphData, error } = ev.data as any;
              if (error) return reject(new Error(error));
              resolve({ similarities, clusters, graphData });
              worker.terminate();
            });
            worker.addEventListener('error', (e) => reject(e));
          });

          worker.postMessage({ documents: processedDocs });
          const res = await workerPromise;
          simResults = res.similarities;
          clusterResults = res.clusters;
          graphResults = res.graphData;
        } catch (err) {
          // If worker fails (bundler/platform), fallback to main-thread compute
          console.warn('Worker failed, falling back to main thread', err);
          simResults = computeAllSimilarities(processedDocs);
          clusterResults = createClusters(processedDocs, simResults, 35);
          graphResults = createGraphData(processedDocs, simResults, clusterResults);
        }
      } else {
  simResults = computeAllSimilarities(processedDocs);
  clusterResults = createClusters(processedDocs, simResults, 35);
  graphResults = createGraphData(processedDocs, simResults, clusterResults);
      }

      setSimilarities(simResults);
      setClusters(clusterResults);
      setGraphData(graphResults);

      toast.success(`Analysis complete! Found ${clusterResults.length} plagiarism clusters.`);
    } catch (error) {
      toast.error('Error processing documents');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm top-0 z-10">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Plagiarism Checker
              </h1>
              <p className="text-muted-foreground mt-1">
                Advanced DSA-powered assignment analysis
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Network className="w-4 h-4 mr-2" />
              C++ DSA Concepts in TypeScript
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12 space-y-12">
        {/* Features */}
        {documents.length === 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="p-6 text-center hover:shadow-elevated transition-shadow">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Text Processing</h3>
              <p className="text-sm text-muted-foreground">
                HashSet stopwords, preprocessing, shingling
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-elevated transition-shadow">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 text-accent" />
              <h3 className="font-semibold mb-2">Similarity Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Rabin-Karp, Edit Distance, LCS algorithms
              </p>
            </Card>
            <Card className="p-6 text-center hover:shadow-elevated transition-shadow">
              <Network className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Graph Clustering</h3>
              <p className="text-sm text-muted-foreground">
                DFS/BFS on adjacency list for clusters
              </p>
            </Card>
          </div>
        )}

        {/* File Uploader */}
        {documents.length === 0 && (
          <div className="max-w-3xl mx-auto">
            <FileUploader onFilesProcessed={handleFilesProcessed} />
          </div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <Card className="p-12 text-center">
            <div className="animate-pulse space-y-4">
              <div className="w-16 h-16 bg-primary/20 rounded-full mx-auto" />
              <h3 className="text-xl font-semibold">Analyzing Documents...</h3>
              <p className="text-muted-foreground">
                Running Rabin-Karp, DP, and Graph algorithms
              </p>
            </div>
          </Card>
        )}

        {/* Results */}
        {documents.length > 0 && !isProcessing && graphData && (
          <div className="space-y-12">
            {/* 3D Visualization */}
            <div>
              <h2 className="text-2xl font-bold mb-4">3D Cluster Graph</h2>
              <p className="text-muted-foreground mb-6">
                Interactive visualization using Three.js. Nodes represent documents, edges show similarity.
              </p>
              <ClusterVisualization nodes={graphData.nodes} edges={graphData.edges} />
            </div>

            {/* Results Display */}
            <ResultsDisplay
              similarities={similarities}
              clusters={clusters}
              documents={documents}
            />

            {/* Reset */}
            <div className="text-center">
              <button
                onClick={() => {
                  setDocuments([]);
                  setSimilarities([]);
                  setClusters([]);
                  setGraphData(null);
                }}
                className="text-primary hover:underline"
              >
                Analyze new documents
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-card/50 mt-24 py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Powered by advanced Data Structures & Algorithms</p>
          <p className="mt-2">
            Rabin-Karp • Edit Distance • Graph Clustering • HashMaps • DFS/BFS
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
