/* eslint-disable */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
console.log('process.env.SUPABASE_DB_URL', process.env.SUPABASE_DB_URL);

async function testConnection() {
  console.log('🔌 Probando conexión a Supabase...');
  console.log(
    'URL:',
    process.env.SUPABASE_DB_URL?.replace(/:[^:@]*@/, ':****@'),
  );

  const pool = new pg.Pool({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { require: true, rejectUnauthorized: false },
  });

  try {
    const client = await pool.connect();
    console.log('✅ Conexión exitosa!');

    // Probar consulta simple
    const result = await client.query('SELECT COUNT(*) FROM docs');
    console.log(`📊 Documentos en la base de datos: ${result.rows[0].count}`);

    // Probar extensión vector
    const vectorResult = await client.query(
      "SELECT * FROM pg_extension WHERE extname = 'vector'",
    );
    if (vectorResult.rows.length > 0) {
      console.log('✅ Extensión pgvector habilitada');
    } else {
      console.log('❌ Extensión pgvector no encontrada');
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
  }
}

testConnection();
