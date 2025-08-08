/* eslint-disable */
import pg from 'pg';
import { pipeline } from '@xenova/transformers';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

let emb = null;

async function getPipe() {
  if (!emb) {
    emb = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return emb;
}

async function embedQuery(text) {
  const p = await getPipe();
  const out = await p(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

async function searchSimilar(query, limit = 5) {
  console.log(`🔍 Buscando documentos similares a: "${query}"`);

  try {
    const client = await pool.connect();

    // Generar embedding de la consulta
    const queryEmbedding = await embedQuery(query);
    const vectorString = `[${queryEmbedding.join(',')}]`;

    // Buscar documentos similares usando similitud coseno
    const result = await client.query(
      `
      SELECT 
        id,
        language,
        domain,
        topic,
        text,
        source,
        year,
        1 - (embedding <=> $1::vector) as similarity
      FROM docs 
      ORDER BY embedding <=> $1::vector
      LIMIT $2
    `,
      [vectorString, limit],
    );

    client.release();

    console.log(`\n📋 Top ${result.rows.length} documentos más relevantes:\n`);

    result.rows.forEach((doc, index) => {
      console.log(
        `${index + 1}. Similitud: ${(doc.similarity * 100).toFixed(1)}%`,
      );
      console.log(`   Idioma: ${doc.language}`);
      console.log(`   Dominio: ${doc.domain}`);
      console.log(`   Tópico: ${doc.topic}`);
      console.log(`   Fuente: ${doc.source}`);
      console.log(`   Texto: ${doc.text.substring(0, 150)}...`);
      console.log('');
    });

    return result.rows;
  } catch (error) {
    console.error('❌ Error en la búsqueda:', error.message);
    return [];
  }
}

async function testQueries() {
  const testQueries = [
    '¿Cómo puedo mejorar mi sueño?',
    'I have anxiety and stress, what can I help me?',
    'Remedios naturales para el dolor de cabeza',
    'How to manage diabetes naturally?',
    'Ejercicios para reducir la ansiedad',
  ];

  console.log('🧪 Probando búsqueda RAG con diferentes consultas...\n');

  for (const query of testQueries) {
    await searchSimilar(query, 3);
    console.log('─'.repeat(80));
    console.log('');
  }

  await pool.end();
}

// Ejecutar pruebas
testQueries().catch(console.error);
