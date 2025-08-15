import * as pg from 'pg';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { EmbeddingService } from '../embedding-service';

const embeddingService = new EmbeddingService();

const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });

type MedicalRecommendation = {
  category: string;
  condition: string;
  suggestion: string;
  language: string;
  source: string;
  year?: number;
};

async function clearDatabase() {
  try {
    console.log('🧹 Limpiando base de datos...');
    await pool.query('DELETE FROM docs');
    console.log('✅ Base de datos limpiada');
  } catch (error) {
    console.error('❌ Error limpiando base de datos:', error);
    throw error;
  }
}

async function upsertRecommendation(r: MedicalRecommendation) {
  if (!r.suggestion) {
    console.log('⚠️ Saltando entrada sin sugerencia:', r);
    return;
  }

  try {
    // Generar embedding del texto combinado para mejor búsqueda
    const textForEmbedding = `${r.category} ${r.condition} ${r.suggestion}`;
    const embedding = await embeddingService.embed(textForEmbedding);

    // Convertir el array a formato vector de PostgreSQL [1,2,3] en lugar de {1,2,3}
    const vectorString = `[${embedding.join(',')}]`;

    // Insertar en la tabla docs
    await pool.query(
      `INSERT INTO docs (id, language, domain, topic, text, source, year, safety_tags, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        crypto.randomUUID(),
        r.language,
        r.category, // domain = category (Natural Medicine, Mental Health, Wellness)
        r.condition, // topic = condition (Insomnia, Anxiety, etc.)
        r.suggestion, // text = suggestion (la recomendación médica)
        r.source,
        r.year || null,
        [], // safety_tags vacío por defecto
        vectorString,
      ],
    );

    console.log(`✅ Insertado: ${r.category} - ${r.condition} (${r.language})`);
  } catch (error) {
    console.error(
      `❌ Error insertando: ${r.category} - ${r.condition}:`,
      error,
    );
  }
}

async function main() {
  try {
    console.log(
      '🚀 Iniciando limpieza y recarga de recomendaciones médicas...',
    );

    // Verificar conexión a la base de datos
    try {
      await pool.query('SELECT 1');
      console.log('✅ Conexión a la base de datos establecida');
    } catch (dbError) {
      console.error(
        '❌ Error de conexión a la base de datos:',
        dbError.message,
      );
      console.log(
        '💡 Asegúrate de que PostgreSQL esté ejecutándose y las variables de entorno estén configuradas',
      );
      console.log('📋 Variables de entorno necesarias: SUPABASE_DB_URL');
      return;
    }

    // Limpiar base de datos
    await clearDatabase();

    // Lee el archivo NDJSON corregido
    const file = 'medical-data.ndjson';

    if (!fs.existsSync(file)) {
      console.error(`📁 Archivo ${file} no encontrado`);
      return;
    }

    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
    console.log(`📚 Procesando ${lines.length} líneas...`);

    for (let i = 0; i < lines.length; i++) {
      try {
        const obj = JSON.parse(lines[i]);
        await upsertRecommendation(obj);

        // Mostrar progreso cada 10 entradas
        if ((i + 1) % 10 === 0) {
          console.log(`📊 Progreso: ${i + 1}/${lines.length}`);
        }
      } catch (error) {
        console.error(`❌ Error en línea ${i + 1}:`, error);
        console.error(`📝 Contenido:`, lines[i]);
      }
    }

    // Optimizar la base de datos
    console.log('🔧 Optimizando base de datos...');
    await pool.query('ANALYZE docs;');

    console.log('🎉 Recarga completa!');
    console.log(`📊 Total de recomendaciones cargadas: ${lines.length}`);
  } catch (error) {
    console.error('❌ Error durante la recarga:', error);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
