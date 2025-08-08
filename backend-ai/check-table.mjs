/* eslint-disable */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkTable() {
  console.log('🔍 Verificando estructura de la tabla...');

  try {
    const client = await pool.connect();

    // Verificar si la tabla existe
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'docs'
      );
    `);

    console.log(`📋 Tabla 'docs' existe: ${tableExists.rows[0].exists}`);

    if (tableExists.rows[0].exists) {
      // Ver estructura de la tabla
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'docs'
        ORDER BY ordinal_position;
      `);

      console.log('\n📊 Estructura de la tabla:');
      structure.rows.forEach((col) => {
        console.log(
          `   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`,
        );
      });

      // Verificar extensión vector
      const vectorExt = await client.query(`
        SELECT * FROM pg_extension WHERE extname = 'vector';
      `);

      console.log(
        `\n🔧 Extensión pgvector: ${vectorExt.rows.length > 0 ? 'Instalada' : 'No instalada'}`,
      );
    }

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTable();
