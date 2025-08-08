// Simplified embedding function that works without ESM issues
// This is a fallback when the main embedding system fails

export function embedQuerySimple(text: string): number[] {
  // Simple hash-based embedding for fallback
  // This is not as good as proper embeddings but allows RAG to work
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(384).fill(0); // Match the dimension in the database

  for (const word of words) {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash + word.charCodeAt(i)) & 0xffffffff;
    }
    const index = Math.abs(hash) % 384;
    embedding[index] += 1;
  }

  // Normalize
  const magnitude = Math.sqrt(
    embedding.reduce((sum, val) => sum + val * val, 0),
  );
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

export function embedPassageSimple(text: string): number[] {
  return embedQuerySimple(text);
}
