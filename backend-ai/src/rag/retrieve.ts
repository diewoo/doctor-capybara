import * as pg from 'pg';
import { embedQuery } from './embed';
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
  const vec = await embedQuery(userQuery);
  const sql = `
    SELECT id, text, source, year
    FROM docs
    WHERE language = $1
    ORDER BY embedding <#> $2
    LIMIT $3
  `;
  const { rows } = await pool.query(sql, [language, vec, topK]);
  return rows as Retrieved[];
}
