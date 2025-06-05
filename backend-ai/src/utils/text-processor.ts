export const cleanPatientInfo = (rawText: string): string => {
  return rawText
    .replace(/<[^>]*>/g, ' ') // Quita etiquetas HTML
    .replace(/\s+/g, ' ') // Colapsa espacios
    .replace(/[^\w\s.,;:!?\-/]/g, '') // Quita caracteres especiales
    .trim()
    .substring(0, 10000); // Limita a 10k
};

export const splitTextIntoChunks = (
  text: string,
  chunkSize: number = 2000,
  overlap: number = 200,
): string[] => {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;

    // Si no estamos al final del texto, intentamos encontrar un buen punto de corte
    if (endIndex < text.length) {
      // Buscar el último espacio o punto antes del chunkSize
      const lastSpace = text.lastIndexOf(' ', endIndex);
      const lastPeriod = text.lastIndexOf('.', endIndex);
      const lastBreak = Math.max(lastSpace, lastPeriod);

      if (lastBreak > startIndex) {
        endIndex = lastBreak + 1;
      }
    }

    chunks.push(text.slice(startIndex, endIndex));
    startIndex = endIndex - overlap;
  }

  return chunks;
};

export const processAndCleanPatientInfo = (patientInfo: string): string => {
  const cleaned = cleanPatientInfo(patientInfo);
  const chunks = splitTextIntoChunks(cleaned);
  return chunks.length > 1 ? chunks.join('\n\n----\n\n') : cleaned;
};
