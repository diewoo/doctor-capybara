import { parentPort } from 'node:worker_threads';

let emb = null;

async function getEmbedder() {
  if (!emb) {
    const { pipeline } = await import('@xenova/transformers');
    emb = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return emb;
}

async function embed(text) {
  const p = await getEmbedder();
  const out = await p(text, { pooling: 'mean', normalize: true });
  // Ensure plain array (384 dims)
  return Array.from(out.data);
}

parentPort.on('message', async (msg) => {
  const { id, text } = msg || {};
  try {
    const embedding = await embed(text || '');
    parentPort.postMessage({ id, ok: true, embedding });
  } catch (error) {
    parentPort.postMessage({
      id,
      ok: false,
      error: error?.message || String(error),
    });
  }
});
