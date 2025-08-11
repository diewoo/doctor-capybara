import React, { SetStateAction, useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/use-language";

interface PropsType {
  isDisabled: boolean;
  setInput: React.Dispatch<SetStateAction<string>>;
  isProcessing: boolean;
  prompts?: string[];
  responseSuggestions?: string[];
  autoSubmit?: (value: string) => void;
}

const defaultPrompts = [
  "¿Cuáles podrían ser las causas de mis síntomas?",
  "¿Qué exámenes médicos debería considerar?",
  "¿Cuándo debería acudir a un médico de urgencia?",
  "¿Qué tratamientos existen para mi condición?",
  "¿Qué puedo hacer en casa para sentirme mejor?",
  "¿Qué medicamentos de venta libre me recomiendas?",
  "¿Qué alimentos debo evitar o consumir más?",
  "¿Cuánto tiempo suele durar esta condición?",
  "¿Necesito reposo absoluto o puedo hacer ejercicio leve?",
  "¿Qué puedo hacer para mejorar mi estado de salud?",
  "¿Qué alimentos puedo consumir para mejorar mi estado de salud?",
  "¿Qué alimentos puedo consumir para mejorar mi estado de salud?",
  "¿Cuál es la mejor manera de tomar mis medicamentos?",
  "¿Qué actividades puedo realizar para mejorar mi estado de salud?",
  "¿Qué alimentos puedo consumir para mejorar mi estado de salud?",
];

const pickRandom = (arr: string[], n: number) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);

const PatientInsightSuggest = ({
  isDisabled,
  setInput,
  isProcessing,
  prompts,
  responseSuggestions,
  autoSubmit,
}: PropsType) => {
  const isMobile = useIsMobile();
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true); // Siempre empezar expandido

  const suggestions =
    responseSuggestions && responseSuggestions.length > 0
      ? responseSuggestions
      : prompts && prompts.length > 0
        ? prompts
        : defaultPrompts;

  // Evita rebarajar en cada render para que no "desaparezcan" al hover
  const suggestionsKey = useMemo(() => suggestions.join("||"), [suggestions]);

  // En mobile mostrar todas las sugerencias disponibles (máximo 4)
  const maxSuggestions = isMobile ? Math.min(suggestions.length, 4) : 4;
  const randomPrompts = useMemo(
    () => pickRandom(suggestions, maxSuggestions),
    [suggestionsKey, maxSuggestions]
  );

  const handlePromptClick = (prompt: string) => {
    if (autoSubmit) {
      autoSubmit(prompt);
    } else {
      // Prefill el input; no enviamos automáticamente para permitir editar
      setInput(prompt);
    }
  };

  useEffect(() => {
    if (!isProcessing) {
      setInput("");
    }
  }, [isProcessing, setInput]);

  // En mobile, si no hay sugerencias, no mostrar nada
  if (isMobile && (!suggestions || suggestions.length === 0)) {
    return null;
  }

  return (
    <div className="relative w-full">
      {/* Header colapsable en mobile también */}
      <div
        className="flex items-center justify-between px-2 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors mb-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-700">
            {isExpanded ? String(t("suggestionsHide")) : String(t("suggestionsShow"))}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-600" />
        )}
      </div>

      {/* Sugerencias - colapsables en mobile y desktop */}
      {isExpanded && (
        <div
          className={`grid gap-2 ${
            isMobile ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {randomPrompts?.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              disabled={isDisabled}
              className={`whitespace-normal text-center h-auto py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg cursor-pointer font-normal transition-all duration-200 shadow-sm hover:shadow bg-white hover:bg-gray-50 text-gray-800 hover:text-gray-900 ${
                isMobile
                  ? "!text-[13px] min-h-[44px] border-gray-200"
                  : "!text-[12.5px] sm:!text-[13px] min-h-[42px] sm:min-h-[48px] border-gray-200"
              }`}
              onClick={() => handlePromptClick(prompt)}
            >
              {prompt}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientInsightSuggest;
