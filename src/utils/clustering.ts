import { Cluster, SimilarityResult, GraphNode, GraphEdge } from '@/types/plagiarism';

/**
 * Graph representation using Adjacency List
 * DSA Concepts: Graph, HashMap, Adjacency List
 */
class Graph {
  private adjList: Map<string, Set<string>>;
  
  constructor() {
    this.adjList = new Map();
  }
  
  addVertex(vertex: string): void {
    if (!this.adjList.has(vertex)) {
      this.adjList.set(vertex, new Set());
    }
  }
  
  addEdge(v1: string, v2: string): void {
    this.addVertex(v1);
    this.addVertex(v2);
    this.adjList.get(v1)!.add(v2);
    this.adjList.get(v2)!.add(v1);
  }
  
  /**
   * Find connected components using DFS
   * DSA Concepts: DFS, Graph traversal, Stack (recursion)
   * Time Complexity: O(V + E)
   */
  findConnectedComponents(): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];
    
    const dfs = (vertex: string, component: string[]): void => {
      visited.add(vertex);
      component.push(vertex);
      
      const neighbors = this.adjList.get(vertex) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, component);
        }
      }
    };
    
    for (const vertex of this.adjList.keys()) {
      if (!visited.has(vertex)) {
        const component: string[] = [];
        dfs(vertex, component);
        components.push(component);
      }
    }
    
    return components;
  }
  
  /**
   * Alternative: BFS for finding connected components
   * DSA Concepts: BFS, Queue, Graph traversal
   */
  findConnectedComponentsBFS(): string[][] {
    const visited = new Set<string>();
    const components: string[][] = [];
    
    const bfs = (startVertex: string): string[] => {
      const queue: string[] = [startVertex];
      const component: string[] = [];
      visited.add(startVertex);
      
      while (queue.length > 0) {
        const vertex = queue.shift()!;
        component.push(vertex);
        
        const neighbors = this.adjList.get(vertex) || new Set();
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
          }
        }
      }
      
      return component;
    };
    
    for (const vertex of this.adjList.keys()) {
      if (!visited.has(vertex)) {
        components.push(bfs(vertex));
      }
    }
    
    return components;
  }
}

/**
 * Create clusters from similarity results using Graph algorithms
 * DSA Concepts: Graph, DFS/BFS, Connected Components
 */
export function createClusters(
  documents: Array<{ id: string; name: string }>,
  similarities: SimilarityResult[],
  threshold: number = 35
): Cluster[] {
  const graph = new Graph();
  
  // Add all documents as vertices
  documents.forEach(doc => graph.addVertex(doc.id));
  
  // Add edges for similar documents (above threshold)
  similarities.forEach(sim => {
    if (sim.similarity >= threshold) {
      graph.addEdge(sim.doc1Id, sim.doc2Id);
    }
  });
  
  // Find connected components using DFS
  const components = graph.findConnectedComponents();
  
  // Convert to Cluster objects
  const clusters: Cluster[] = components
    .filter(comp => comp.length > 1) // Only clusters with 2+ documents
    .map((comp, index) => {
      // Calculate average similarity within cluster
      const clusterSims = similarities.filter(sim =>
        comp.includes(sim.doc1Id) && comp.includes(sim.doc2Id)
      );
      const avgSim = clusterSims.length > 0
        ? clusterSims.reduce((sum, s) => sum + s.similarity, 0) / clusterSims.length
        : 0;
      
      return {
        id: index,
        documents: comp,
        avgSimilarity: avgSim
      };
    });
  
  return clusters;
}

/**
 * Create graph data for 3D visualization
 */
export function createGraphData(
  documents: Array<{ id: string; name: string }>,
  similarities: SimilarityResult[],
  clusters: Cluster[]
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = documents.map((doc, index) => {
    // Find which cluster this document belongs to
    const clusterIndex = clusters.findIndex(c => c.documents.includes(doc.id));
    
    // Position nodes in 3D space (circular layout per cluster)
    const angle = (index * 2 * Math.PI) / documents.length;
    const radius = 5;
    
    return {
      id: doc.id,
      name: doc.name,
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
      z: clusterIndex >= 0 ? clusterIndex * 2 : 0,
      cluster: clusterIndex >= 0 ? clusterIndex : -1
    };
  });
  
  const edges: GraphEdge[] = similarities
    .filter(sim => sim.similarity >= 35) // Show edges with 35%+ similarity
    .map(sim => ({
      source: sim.doc1Id,
      target: sim.doc2Id,
      similarity: sim.similarity
    }));
  
  return { nodes, edges };
}
