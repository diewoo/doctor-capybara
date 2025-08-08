// Dynamic import for ESM module
let pipeline: any = null;

async function getPipeline() {
  if (!pipeline) {
    const transformers = await import('@xenova/transformers');
    pipeline = transformers.pipeline;
  }
  return pipeline;
}

let emb: any = null;

async function getPipe(): Promise<any> {
  if (!emb) {
    try {
      const pipe = await getPipeline();
      emb = await pipe('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    } catch (error) {
      throw new Error(`Failed to initialize pipeline: ${error}`);
    }
  }
  return emb;
}

// Para indexar documentos (pasajes)
export async function embedPassage(text: string): Promise<number[]> {
  const p = await getPipe();
  const out = await p(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data as Float32Array); // 768 dims
}

// Para consultas del usuario
export async function embedQuery(text: string): Promise<number[]> {
  const p = await getPipe();
  const out = await p(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data as Float32Array);
}
