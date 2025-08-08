-- Habilitar la extensión pgvector para embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Crear la tabla docs para almacenar documentos médicos
CREATE TABLE IF NOT EXISTS docs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    language TEXT NOT NULL,
    domain TEXT,
    topic TEXT,
    text TEXT NOT NULL,
    source TEXT,
    year INTEGER,
    safety_tags JSONB DEFAULT '[]',
    embedding vector(384), -- 384 dimensiones para multilingual-e5-small
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para búsqueda eficiente
CREATE INDEX IF NOT EXISTS docs_language_idx ON docs(language);
CREATE INDEX IF NOT EXISTS docs_domain_idx ON docs(domain);
CREATE INDEX IF NOT EXISTS docs_topic_idx ON docs(topic);
CREATE INDEX IF NOT EXISTS docs_year_idx ON docs(year);

-- Índice vectorial para búsqueda de similitud
CREATE INDEX IF NOT EXISTS docs_embedding_idx ON docs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para actualizar updated_at
CREATE TRIGGER update_docs_updated_at BEFORE UPDATE ON docs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Función para búsqueda de similitud
CREATE OR REPLACE FUNCTION similarity_search(
    query_embedding vector(384),
    match_threshold float,
    match_count int,
    filter_language text DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    text TEXT,
    source TEXT,
    year INTEGER,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        docs.id,
        docs.text,
        docs.source,
        docs.year,
        1 - (docs.embedding <=> query_embedding) AS similarity
    FROM docs
    WHERE 
        (filter_language IS NULL OR docs.language = filter_language)
        AND 1 - (docs.embedding <=> query_embedding) > match_threshold
    ORDER BY docs.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Insertar algunos datos de ejemplo para probar
INSERT INTO docs (language, domain, topic, text, source, year, embedding) VALUES
('Español', 'Medicina Natural', 'Insomnio', 'Toma té de manzanilla antes de acostarte para mejorar la calidad del sueño', 'Centro Nacional de Salud Complementaria e Integrativa (NCCIH), 2022', 2022, NULL),
('English', 'Natural Medicine', 'Insomnia', 'Try chamomile tea before bedtime to improve sleep quality', 'National Center for Complementary and Integrative Health (NCCIH), 2022', 2022, NULL),
('Español', 'Salud Mental', 'Ansiedad', 'Practica la meditación de atención plena durante 10-30 minutos al día para reducir los síntomas de ansiedad', 'Asociación Americana de Psicología (APA), 2021', 2021, NULL);

-- Crear políticas de seguridad (opcional)
ALTER TABLE docs ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública
CREATE POLICY "Allow public read access" ON docs
    FOR SELECT USING (true);

-- Política para permitir inserción desde la aplicación
CREATE POLICY "Allow authenticated insert" ON docs
    FOR INSERT WITH CHECK (true);
