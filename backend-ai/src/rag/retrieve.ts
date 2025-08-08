import * as pg from 'pg';
import { embedQuery } from './embed';
import { embedQuerySimple } from './embed-simple';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });

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
    // Try the main embedding system first
    vec = await embedQuery(userQuery);
  } catch (error) {
    console.log('Main embedding failed, using fallback:', error.message);
    // Fallback to simple embedding
    vec = embedQuerySimple(userQuery);
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
