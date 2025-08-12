import * as pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({ connectionString: process.env.SUPABASE_DB_URL });

export interface AdvancedFilters {
  category?: string[];
  evidence_level?: string[];
  severity?: string[];
  year_range?: { min?: number; max?: number };
}

export interface RetrievedAdvanced {
  id: string;
  text: string;
  source: string;
  year: number;
  category: string;
  evidence_level: string;
  severity: string;
  score: number;
}

/**
 * Búsqueda avanzada con filtros por metadatos
 */
export async function retrieveContextAdvanced(
  userQuery: string,
  language: 'Español' | 'English',
  filters?: AdvancedFilters,
  topK: number = 10,
): Promise<RetrievedAdvanced[]> {
  try {
    // Construir la consulta SQL dinámicamente
    let sql = `
      SELECT 
        id, text, source, year, 
        COALESCE(category, 'general') as category,
        COALESCE(evidence_level, 'D') as evidence_level,
        COALESCE(severity, 'low') as severity,
        1.0 as score
      FROM docs
      WHERE language = $1
    `;

    const params: any[] = [language];
    let paramIndex = 2;

    // Agregar filtros de categoría
    if (filters?.category && filters.category.length > 0) {
      sql += ` AND category = ANY($${paramIndex})`;
      params.push(filters.category);
      paramIndex++;
    }

    // Agregar filtros de nivel de evidencia
    if (filters?.evidence_level && filters.evidence_level.length > 0) {
      sql += ` AND evidence_level = ANY($${paramIndex})`;
      params.push(filters.evidence_level);
      paramIndex++;
    }

    // Agregar filtros de severidad
    if (filters?.severity && filters.severity.length > 0) {
      sql += ` AND severity = ANY($${paramIndex})`;
      params.push(filters.severity);
      paramIndex++;
    }

    // Agregar filtros de año
    if (filters?.year_range) {
      if (filters.year_range.min) {
        sql += ` AND year >= $${paramIndex}`;
        params.push(filters.year_range.min);
        paramIndex++;
      }
      if (filters.year_range.max) {
        sql += ` AND year <= $${paramIndex}`;
        params.push(filters.year_range.max);
        paramIndex++;
      }
    }

    // Ordenar por relevancia (priorizar evidencia A, luego B, etc.)
    sql += `
      ORDER BY 
        CASE evidence_level
          WHEN 'A' THEN 1
          WHEN 'B' THEN 2
          WHEN 'C' THEN 3
          WHEN 'D' THEN 4
          ELSE 5
        END,
        year DESC
      LIMIT $${paramIndex}
    `;

    params.push(topK);

    console.log('🔍 Advanced RAG query:', sql);
    console.log('🔍 Parameters:', params);

    const { rows } = await pool.query(sql, params);

    console.log(
      `✅ Advanced RAG found ${rows.length} results for "${userQuery}" in ${language}`,
    );

    return rows as RetrievedAdvanced[];
  } catch (error) {
    console.error('Error in advanced RAG:', error);
    // Fallback: retornar array vacío
    return [];
  }
}

/**
 * Búsqueda inteligente que detecta idioma y busca en ambos idiomas
 */
export async function retrieveContextSmart(
  userQuery: string, // Query original del usuario
  topK: number = 10,
): Promise<RetrievedAdvanced[]> {
  console.log('🚀 retrieveContextSmart iniciado');
  console.log('🚀 Query original:', userQuery);
  console.log('🚀 TopK:', topK);

  // Detectar idioma de la consulta
  const detectedLanguage = detectLanguage(userQuery);
  console.log('🌍 Idioma detectado:', detectedLanguage);

  // Detectar categoría médica
  const detectedCategory = detectMedicalCategory(userQuery);
  console.log('🚀 Categoría detectada:', detectedCategory);

  // Crear filtros si detectamos categoría
  const filters: AdvancedFilters | undefined = detectedCategory
    ? {
        category: [detectedCategory],
        evidence_level: ['A', 'B'], // Priorizar evidencia alta
        severity: ['low', 'medium'], // Evitar casos de emergencia
      }
    : undefined;

  console.log('🚀 Filtros aplicados:', filters);

  // Buscar primero en el idioma original del usuario
  let results = await retrieveContextAdvanced(
    userQuery,
    detectedLanguage,
    filters,
    Math.ceil(topK * 0.7), // 70% de resultados del idioma original
  );

  console.log(
    `✅ Encontrados ${results.length} resultados en ${detectedLanguage}`,
  );

  // Si no hay suficientes resultados, buscar en el otro idioma
  if (results.length < topK) {
    const otherLanguage =
      detectedLanguage === 'Español' ? 'English' : 'Español';
    const remainingCount = topK - results.length;

    console.log(
      `🔄 Buscando ${remainingCount} resultados adicionales en ${otherLanguage}`,
    );

    const otherResults = await retrieveContextAdvanced(
      userQuery,
      otherLanguage,
      filters,
      remainingCount,
    );

    console.log(
      `✅ Encontrados ${otherResults.length} resultados adicionales en ${otherLanguage}`,
    );

    // Combinar resultados, priorizando el idioma original
    results = [...results, ...otherResults];
  }

  console.log(`🎯 Total de resultados: ${results.length}`);
  return results;
}

/**
 * Detectar idioma de la consulta del usuario
 */
function detectLanguage(text: string): 'Español' | 'English' {
  const queryLower = text.toLowerCase();

  // Patrones típicos del español
  const spanishPattern = /[áéíóúñü]/i;
  const spanishWords = [
    'me',
    'te',
    'se',
    'le',
    'nos',
    'os',
    'les',
    'que',
    'de',
    'el',
    'la',
    'los',
    'las',
    'tengo',
    'tiene',
    'dolor',
    'duele',
    'problema',
    'síntoma',
    'enfermedad',
    'tratamiento',
  ];

  // Si tiene caracteres especiales del español o palabras comunes
  if (
    spanishPattern.test(text) ||
    spanishWords.some((word) => queryLower.includes(word))
  ) {
    return 'Español';
  }

  return 'English';
}

/**
 * Detectar categoría médica de la consulta
 */
function detectMedicalCategory(userQuery: string): string | null {
  const queryLower = userQuery.toLowerCase();

  console.log('🔍 DEBUG: detectMedicalCategory iniciado');
  console.log('🔍 DEBUG: Query original:', userQuery);
  console.log('🔍 DEBUG: Query en minúsculas:', queryLower);

  const medicalCategories = [
    // Cardiología y circulación
    {
      keywords: [
        'heart',
        'cardiac',
        'cardiovascular',
        'blood pressure',
        'hypertension',
        'corazón',
        'cardiaco',
        'cardiovascular',
        'presión',
        'hipertensión',
        'palpitaciones',
        'palpitations',
        'dolor de pecho',
        'chest pain',
        'mareo',
        'dizziness',
        'fatiga',
        'fatigue',
        'edema',
        'swelling',
      ],
      category: 'cardiology',
    },
    // Neurología y cerebro
    {
      keywords: [
        'brain',
        'neurological',
        'nervous',
        'headache',
        'migraine',
        'cerebro',
        'neurológico',
        'nervioso',
        'dolor de cabeza',
        'migraña',
        'jaqueca',
        'cabeza',
        'duele cabeza',
        'dolor cabeza',
        'memory',
        'memoria',
        'concentration',
        'concentración',
        'tremor',
        'temblor',
        'numbness',
        'entumecimiento',
        'seizure',
        'convulsión',
      ],
      category: 'neurology',
    },
    // Pediatría y niños
    {
      keywords: [
        'child',
        'pediatric',
        'infant',
        'baby',
        'niño',
        'pediátrico',
        'bebé',
        'infante',
        'fever',
        'fiebre',
        'vaccine',
        'vacuna',
        'growth',
        'crecimiento',
        'development',
        'desarrollo',
      ],
      category: 'pediatrics',
    },
    // Dermatología y piel
    {
      keywords: [
        'skin',
        'dermatology',
        'rash',
        'acne',
        'piel',
        'dermatología',
        'erupción',
        'acné',
        'itch',
        'picazón',
        'burn',
        'quemadura',
        'wound',
        'herida',
        'mole',
        'lunar',
        'hair loss',
        'caída de pelo',
      ],
      category: 'dermatology',
    },
    // Psiquiatría y salud mental
    {
      keywords: [
        'mental',
        'psychology',
        'anxiety',
        'depression',
        'stress',
        'mental',
        'psicología',
        'ansiedad',
        'depresión',
        'estrés',
        'panic',
        'pánico',
        'mood',
        'estado de ánimo',
        'sleep',
        'sueño',
        'insomnia',
        'insomnio',
        'appetite',
        'apetito',
        'concentration',
      ],
      category: 'psychiatry',
    },
    // Endocrinología y metabolismo
    {
      keywords: [
        'diabetes',
        'insulin',
        'blood sugar',
        'glucose',
        'diabetes',
        'insulina',
        'azúcar',
        'glucosa',
        'thyroid',
        'tiroides',
        'hormone',
        'hormona',
        'weight',
        'peso',
        'metabolism',
        'metabolismo',
        'cholesterol',
        'colesterol',
        'thyroid',
        'tiroides',
      ],
      category: 'endocrinology',
    },
    // Gastroenterología
    {
      keywords: [
        'stomach',
        'estómago',
        'digestion',
        'digestión',
        'nausea',
        'náusea',
        'vomit',
        'vómito',
        'diarrhea',
        'diarrea',
        'constipation',
        'estreñimiento',
        'bloating',
        'hinchazón',
        'acid reflux',
        'reflujo',
        'ulcer',
        'úlcera',
        'liver',
        'hígado',
        'gallbladder',
        'vesícula',
      ],
      category: 'gastroenterology',
    },
    // Respiratorio
    {
      keywords: [
        'lung',
        'pulmón',
        'breathing',
        'respiración',
        'cough',
        'tos',
        'asthma',
        'asma',
        'bronchitis',
        'bronquitis',
        'pneumonia',
        'neumonía',
        'shortness of breath',
        'falta de aire',
        'wheezing',
        'sibilancias',
        'chest congestion',
        'congestión de pecho',
      ],
      category: 'respiratory',
    },
    // Ortopedia y músculos
    {
      keywords: [
        'bone',
        'hueso',
        'joint',
        'articulación',
        'muscle',
        'músculo',
        'back pain',
        'dolor de espalda',
        'knee',
        'rodilla',
        'shoulder',
        'hombro',
        'fracture',
        'fractura',
        'sprain',
        'esguince',
        'arthritis',
        'artritis',
        'inflammation',
        'inflamación',
      ],
      category: 'orthopedics',
    },
    // Ginecología y salud femenina
    {
      keywords: [
        'pregnancy',
        'embarazo',
        'menstruation',
        'menstruación',
        'ovary',
        'ovario',
        'breast',
        'seno',
        'mammogram',
        'mamografía',
        'menopause',
        'menopausia',
        'fertility',
        'fertilidad',
      ],
      category: 'gynecology',
    },
    // Urología y salud masculina
    {
      keywords: [
        'prostate',
        'próstata',
        'urination',
        'micción',
        'kidney',
        'riñón',
        'bladder',
        'vejiga',
        'urinary tract',
        'tracto urinario',
        'erectile dysfunction',
        'disfunción eréctil',
      ],
      category: 'urology',
    },
    // Oftalmología y visión
    {
      keywords: [
        'eye',
        'ojo',
        'vision',
        'visión',
        'blur',
        'borrosa',
        'dry eyes',
        'ojos secos',
        'redness',
        'enrojecimiento',
        'glasses',
        'lentes',
        'contact lens',
        'lentes de contacto',
        'cataract',
        'catarata',
      ],
      category: 'ophthalmology',
    },
    // Otorrinolaringología
    {
      keywords: [
        'ear',
        'oído',
        'nose',
        'nariz',
        'throat',
        'garganta',
        'hearing',
        'audición',
        'tinnitus',
        'zumbido',
        'sinus',
        'seno nasal',
        'tonsil',
        'amígdala',
        'voice',
        'voz',
      ],
      category: 'ent',
    },
    // Inmunología y alergias
    {
      keywords: [
        'allergy',
        'alergia',
        'immune',
        'inmune',
        'infection',
        'infección',
        'fever',
        'fiebre',
        'inflammation',
        'inflamación',
        'autoimmune',
        'autoinmune',
        'vaccine',
        'vacuna',
        'antibody',
        'anticuerpo',
      ],
      category: 'immunology',
    },
    // Nutrición y bienestar
    {
      keywords: [
        'nutrition',
        'nutrición',
        'diet',
        'dieta',
        'vitamin',
        'vitamina',
        'supplement',
        'suplemento',
        'weight loss',
        'pérdida de peso',
        'healthy eating',
        'alimentación saludable',
        'fiber',
        'fibra',
      ],
      category: 'nutrition',
    },
    // Sueño y descanso
    {
      keywords: [
        'sleep',
        'insomnia',
        'dormir',
        'sueño',
        'no puedo dormir',
        'problemas para dormir',
        'dificultad para dormir',
        'rest',
        'descanso',
        'tired',
        'cansado',
        'energy',
        'energía',
        'circadian',
        'circadiano',
      ],
      category: 'sleep',
    },
    // Dolor general
    {
      keywords: [
        'pain',
        'dolor',
        'ache',
        'duele',
        'me duele',
        'chronic pain',
        'dolor crónico',
        'acute pain',
        'dolor agudo',
        'discomfort',
        'malestar',
        'sore',
        'adolorido',
        'tender',
        'sensible',
      ],
      category: 'pain_management',
    },
  ];

  for (const { keywords, category } of medicalCategories) {
    console.log('🔍 DEBUG: Probando categoría:', category);
    console.log('🔍 DEBUG: Keywords:', keywords);

    const hasMatch = keywords.some((keyword) => queryLower.includes(keyword));
    console.log('🔍 DEBUG: ¿Hay match?', hasMatch);

    if (hasMatch) {
      console.log('🎯 DEBUG: ¡Categoría encontrada!', category);
      return category;
    }
  }

  console.log('❌ DEBUG: No se encontró ninguna categoría');
  return null;
}
