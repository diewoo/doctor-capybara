# 🏥 Sistema RAG Simplificado para Recomendaciones Médicas

## 📋 Descripción

Sistema RAG que usa **exactamente** las 3 categorías que especificaste:

- **Natural Medicine** (Medicina Natural)
- **Mental Health** (Salud Mental)
- **Wellness** (Bienestar)

## 🚀 Cómo usar

### 1. **Cargar datos limpios (RECOMENDADO)**

```bash
# Limpiar base de datos y cargar todo de nuevo
npm run clear-and-ingest
```

### 2. **O solo ingestar datos**

```bash
# Usar el archivo de datos con TODA tu información
npm run ingest medical-data.ndjson

# O usar tu archivo existente
npm run ingest data.ndjson
```

### 3. **El sistema ya está integrado**

Tu `retrieve-advanced.ts` ya está funcionando y usa:

- Detección automática de idioma (español/inglés)
- Detección de categorías usando keywords específicos
- Búsqueda híbrida (categoría + similitud vectorial)
- Búsqueda multilingüe automática

### 4. **Estructura de datos**

El sistema mapea directamente:

- `category` → `domain` (en la tabla docs)
- `condition` → `topic` (en la tabla docs)
- `suggestion` → `text` (en la tabla docs)

## 🔍 Cómo funciona

1. **Usuario pregunta**: "No puedo dormir, ¿qué puedo hacer?"
2. **Sistema detecta**:
   - Idioma: Español
   - Categoría: Natural Medicine (por keywords como "dormir", "sueño")
3. **Busca**: Recomendaciones de Natural Medicine para insomnio
4. **Retorna**: Té de manzanilla, aromaterapia con lavanda, etc.

## 📁 Archivos que necesitas

- ✅ `retrieve-advanced.ts` - Ya tienes, simplificado
- ✅ `ingest.ts` - Limpio, sin campos legacy
- ✅ `clear-and-ingest.ts` - Para cargar todo de nuevo
- ✅ `medical-data.ndjson` - Con TODA tu información
- ❌ ~~Archivos innecesarios borrados~~

## 🎯 Ventajas

- **Simple**: Solo 3 categorías principales
- **Eficiente**: Usa tu tabla `docs` existente
- **Inteligente**: Detecta idioma y categoría automáticamente
- **Completo**: Incluye todas las recomendaciones que me diste
- **Limpio**: Sin campos legacy, estructura directa

## 🚀 Próximos pasos

1. **Cargar todo de nuevo**: `npm run clear-and-ingest`
2. **Probar**: El sistema ya está funcionando en tu servicio
3. **Expandir**: Agregar más recomendaciones al archivo NDJSON

## 📊 Estructura de datos esperada

```json
{
  "category": "Natural Medicine",
  "condition": "Insomnia",
  "suggestion": "Try chamomile tea before bedtime to improve sleep quality",
  "language": "English",
  "source": "National Center for Complementary and Integrative Health, 2022",
  "factors": null
}
```

¡Listo! Tu sistema RAG ahora es simple, eficiente, limpio y usa exactamente la estructura que querías.
