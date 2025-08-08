import * as pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import { embedPassage } from '../embed';

const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });

type AnyRec = Record<string, any>;

function norm(r: AnyRec) {
  const text =
    r.recomendacion ||
    r.sugerencia ||
    r.recommendation ||
    r.suggestion ||
    r.text;
  const language = r.idioma || r.language || 'Español';
  const domain =
    r.categoria ||
    r.category ||
    r.focus ||
    r.condition ||
    r.symptom ||
    'Wellness';
  const topic = r.sintoma || r.condition || r.focus || 'General';
  const source = r.fuente || r.source || 'N/A';
  const year = Number(String(source).match(/\b(20\d{2}|19\d{2})\b/)?.[0] ?? 0);
  return { text, language, domain, topic, source, year };
}

async function upsert(r: AnyRec) {
  const n = norm(r);
  if (!n.text) return;
  const v = await embedPassage(n.text);
  await pool.query(
    `INSERT INTO docs (id, language, domain, topic, text, source, year, safety_tags, embedding)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) 
     ON CONFLICT (id) DO UPDATE SET language=EXCLUDED.language, domain=EXCLUDED.domain, topic=EXCLUDED.topic,
       text=EXCLUDED.text, source=EXCLUDED.source, year=EXCLUDED.year, safety_tags=EXCLUDED.safety_tags, embedding=EXCLUDED.embedding`,
    [
      crypto.randomUUID(),
      n.language,
      n.domain,
      n.topic,
      n.text,
      n.source,
      n.year,
      [],
      v,
    ],
  );
}

async function main() {
  // Lee un archivo NDJSON (una línea = JSON)
  const file = process.argv[2] || 'data.ndjson';
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  for (const line of lines) {
    const obj = JSON.parse(line);
    await upsert(obj);
  }
  await pool.query('ANALYZE docs;');
  await pool.end();
  console.log('Ingesta completa');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
