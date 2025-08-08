/* eslint-disable */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function fixTable() {
  console.log('🔧 Recreando tabla docs con 384 dimensiones...');

  try {
    const client = await pool.connect();

    // Eliminar tabla existente
    await client.query('DROP TABLE IF EXISTS docs CASCADE;');
    console.log('🗑️ Tabla anterior eliminada');

    // Crear tabla con 384 dimensiones
    await client.query(`
      CREATE TABLE docs (
        id TEXT PRIMARY KEY,
        language TEXT,
        domain TEXT,
        topic TEXT,
        text TEXT,
        source TEXT,
        year INTEGER,
        safety_tags TEXT[],
        embedding vector(384)
      );
    `);
    console.log('✅ Tabla docs creada con 384 dimensiones');

    // Crear índices
    await client.query(`
      CREATE INDEX ON docs USING ivfflat (embedding vector_cosine_ops)
      WITH (lists = 100);
    `);
    console.log('✅ Índice vectorial creado');

    // Habilitar RLS
    await client.query('ALTER TABLE docs ENABLE ROW LEVEL SECURITY;');
    console.log('✅ RLS habilitado');

    // Crear políticas
    await client.query(`
      CREATE POLICY "Allow public read access" ON docs
      FOR SELECT USING (true);
    `);
    console.log('✅ Política de lectura pública creada');

    client.release();
    await pool.end();
    console.log('🎉 Tabla docs configurada correctamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

fixTable();
