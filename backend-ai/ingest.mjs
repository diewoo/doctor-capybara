import pg from 'pg';
import crypto from 'crypto';
import fs from 'fs';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });

let emb = null;

async function getPipe() {
  if (!emb) {
    emb = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return emb;
}

async function embedPassage(text) {
  const p = await getPipe();
  const out = await p('passage: ' + text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

function norm(r) {
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

async function upsert(r) {
  const n = norm(r);
  if (!n.text) return;
  const v = await embedPassage(n.text);

  // Convertir el array a formato vector de PostgreSQL
  const vectorString = `[${v.join(',')}]`;

  await pool.query(
    `INSERT INTO docs (id, language, domain, topic, text, source, year, safety_tags, embedding)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::vector) 
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
      vectorString,
    ],
  );
}

async function main() {
  const file = process.argv[2] || 'data.ndjson';
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);

  console.log(`📚 Procesando ${lines.length} documentos...`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    try {
      const obj = JSON.parse(line);
      await upsert(obj);
      if ((i + 1) % 10 === 0) {
        console.log(`✅ Procesados ${i + 1}/${lines.length} documentos`);
      }
    } catch (error) {
      console.error(`❌ Error en línea ${i + 1}:`, error.message);
    }
  }

  await pool.query('ANALYZE docs;');
  await pool.end();
  console.log('🎉 Ingesta completa');
}

main().catch((e) => {
  console.error('Error:', e);
  process.exit(1);
});
