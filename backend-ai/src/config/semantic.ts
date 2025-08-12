export interface SemanticConfig {
  threshold: number;
  maxResults: number;
  enableHybrid: boolean;
}

export const semanticConfig: SemanticConfig = {
  threshold: 0.6, // Siempre activo, threshold más permisivo
  maxResults: 5,
  enableHybrid: true, // Siempre usar búsqueda híbrida
};

export const getSemanticConfig = (): SemanticConfig => semanticConfig;
