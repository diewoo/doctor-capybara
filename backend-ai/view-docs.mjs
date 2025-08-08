/* eslint-disable */
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
});

async function viewDocs() {
  console.log('📚 Consultando documentos en la base de datos...');

  try {
    const client = await pool.connect();

    // Contar total de documentos
    const countResult = await client.query('SELECT COUNT(*) FROM docs');
    console.log(`📊 Total de documentos: ${countResult.rows[0].count}`);

    // Ver algunos documentos de ejemplo
    const docsResult = await client.query(`
      SELECT id, language, domain, topic, text, source, year 
      FROM docs 
      ORDER BY id 
      LIMIT 10
    `);

    console.log('\n📋 Últimos 10 documentos:');
    docsResult.rows.forEach((doc, index) => {
      console.log(`\n${index + 1}. ID: ${doc.id}`);
      console.log(`   Idioma: ${doc.language}`);
      console.log(`   Dominio: ${doc.domain}`);
      console.log(`   Tópico: ${doc.topic}`);
      console.log(`   Fuente: ${doc.source}`);
      console.log(`   Año: ${doc.year}`);
      console.log(`   Texto: ${doc.text.substring(0, 100)}...`);
    });

    // Ver estadísticas por idioma
    const langStats = await client.query(`
      SELECT language, COUNT(*) as count 
      FROM docs 
      GROUP BY language 
      ORDER BY count DESC
    `);

    console.log('\n🌍 Estadísticas por idioma:');
    langStats.rows.forEach((stat) => {
      console.log(`   ${stat.language}: ${stat.count} documentos`);
    });

    // Ver estadísticas por dominio
    const domainStats = await client.query(`
      SELECT domain, COUNT(*) as count 
      FROM docs 
      GROUP BY domain 
      ORDER BY count DESC
    `);

    console.log('\n📂 Estadísticas por dominio:');
    domainStats.rows.forEach((stat) => {
      console.log(`   ${stat.domain}: ${stat.count} documentos`);
    });

    client.release();
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

viewDocs();
