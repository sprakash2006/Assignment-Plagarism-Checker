import { computeAllSimilarities } from '@/utils/similarityComputation';
import { createClusters, createGraphData } from '@/utils/clustering';

// Types are simple to avoid bundler issues in worker
self.addEventListener('message', async (ev) => {
  const { documents } = ev.data;

  try {
    const similarities = computeAllSimilarities(documents);
  const clusters = createClusters(documents, similarities, 35);
    const graphData = createGraphData(documents, similarities, clusters);

    // Post result back
    // @ts-ignore
    postMessage({ similarities, clusters, graphData });
  } catch (err) {
    // @ts-ignore
    postMessage({ error: (err && err.message) || String(err) });
  }
});
