import { Worker } from 'node:worker_threads';
import * as path from 'node:path';
import * as fs from 'node:fs';

// Resolve worker path robustly for dev (ts-node) and prod (dist)
const workerPathFromCwd = path.resolve(process.cwd(), 'embedding-worker.mjs');
const workerPathFromSrc = path.resolve(__dirname, '../../embedding-worker.mjs');
const workerPathFromDist = path.resolve(
  __dirname,
  '../../../embedding-worker.mjs',
);

const WORKER_PATH =
  [workerPathFromCwd, workerPathFromSrc, workerPathFromDist].find((p) =>
    fs.existsSync(p),
  ) || workerPathFromCwd;

type Pending = {
  resolve: (v: number[]) => void;
  reject: (e: Error) => void;
};

export class EmbeddingService {
  private worker: Worker | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();

  private ensureWorker(): void {
    if (this.worker) return;

    this.worker = new Worker(WORKER_PATH);
    this.worker.on('message', (msg: unknown) => {
      const { id, ok, embedding, error } = (msg || {}) as {
        id: number;
        ok: boolean;
        embedding?: number[];
        error?: string;
      };
      const pending = this.pending.get(id);
      if (!pending) return;
      this.pending.delete(id);
      if (ok) {
        const safeEmbedding: number[] = Array.isArray(embedding)
          ? embedding
          : [];
        pending.resolve(safeEmbedding);
      } else {
        pending.reject(new Error(error || 'Embedding failed'));
      }
    });
    this.worker.on('error', (err: Error) => {
      // Fail all pending
      for (const [id, p] of this.pending) {
        p.reject(err);
        this.pending.delete(id);
      }
      this.worker = null;
    });
    this.worker.on('exit', () => {
      for (const [id, p] of this.pending) {
        p.reject(new Error('Worker exited'));
        this.pending.delete(id);
      }
      this.worker = null;
    });
  }

  async embed(text: string): Promise<number[]> {
    this.ensureWorker();
    const id = this.nextId++;
    return new Promise<number[]>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker!.postMessage({ id, text });
    });
  }
}
