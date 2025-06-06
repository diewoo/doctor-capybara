import React, { SetStateAction } from "react";
import { Button } from "../ui/button";

interface PropsType {
  isDisabled: boolean;
  onSubmit: (value: string) => void;
  setInput: React.Dispatch<SetStateAction<string>>;
}

const prompts = [
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

const randomPrompts = prompts.sort(() => Math.random() - 0.5).slice(0, 4);

const PatientInsightSuggest = ({
  isDisabled,
  setInput,
  onSubmit,
}: PropsType) => {
  const handlePromptClick = (prompt: string) => {
    onSubmit(prompt);
    setInput(prompt);
  };
  return (
    <div className="relative w-full mb-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {randomPrompts?.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            disabled={isDisabled}
            className="whitespace-nowrap rounded-full cursor-pointer font-normal !text-[12.5px] hover:bg-gray-50"
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
