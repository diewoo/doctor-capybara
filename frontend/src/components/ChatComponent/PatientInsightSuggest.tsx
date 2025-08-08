import React, { SetStateAction, useEffect, useMemo } from "react";
import { Button } from "../ui/button";

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
  const suggestions =
    responseSuggestions && responseSuggestions.length > 0
      ? responseSuggestions
      : prompts && prompts.length > 0
        ? prompts
        : defaultPrompts;
  // Evita rebarajar en cada render para que no "desaparezcan" al hover
  const suggestionsKey = useMemo(() => suggestions.join("||"), [suggestions]);
  const randomPrompts = useMemo(() => pickRandom(suggestions, 4), [suggestionsKey]);

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
  return (
    <div className="relative w-full mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 px-2 sm:px-0">
        {randomPrompts?.map((prompt) => (
          <Button
            key={prompt}
            variant="outline"
            size="sm"
            disabled={isDisabled}
            className="whitespace-normal text-center h-auto py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg cursor-pointer font-normal !text-[12.5px] sm:!text-[13px] flex items-center justify-center min-h-[42px] sm:min-h-[48px] border-gray-200 transition-all duration-200 shadow-sm hover:shadow bg-white hover:bg-gray-50 text-gray-800 hover:text-gray-900"
            onClick={() => handlePromptClick(prompt)}
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default PatientInsightSuggest;
