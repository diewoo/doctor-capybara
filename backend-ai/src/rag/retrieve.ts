import * as pg from 'pg';
import * as dotenv from 'dotenv';
import { EmbeddingService } from './embedding-service';
import { embedQuery as embedQueryLegacy } from './embed';
import { embedQuerySimple } from './embed-simple';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });
const embeddingService = new EmbeddingService();

export type Retrieved = {
  id: string;
  text: string;
  source: string;
  year: number;
};

export async function retrieveContext(
  userQuery: string,
  language: 'Español' | 'English',
  topK = 6,
): Promise<Retrieved[]> {
  let vec: number[];

  try {
    // Prefer worker-based embeddings (ESM-safe)
    vec = await embeddingService.embed(userQuery);
  } catch (workerError) {
    console.error('Error embedding query with worker:', workerError);
    try {
      // Fallback to legacy (dynamic import path) if available
      vec = await embedQueryLegacy(userQuery);
    } catch (legacyError) {
      console.error('Error embedding query with legacy method:', legacyError);
      // Last resort fallback (lower quality)
      vec = embedQuerySimple(userQuery);
    }
  }

  // Convert array to PostgreSQL vector format
  const vectorString = `[${vec.join(',')}]`;

  const sql = `
    SELECT id, text, source, year
    FROM docs
    WHERE language = $1
    ORDER BY embedding <#> $2::vector
    LIMIT $3
  `;
  const { rows } = await pool.query(sql, [language, vectorString, topK]);
  return rows as Retrieved[];
}
