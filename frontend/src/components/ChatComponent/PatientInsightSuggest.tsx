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
  "¿Cuáles son los efectos secundarios de los medicamentos?",
  "¿Qué hábitos saludables puedo adoptar para mejorar mi salud?",
  "¿Cómo puedo prevenir que esto vuelva a ocurrir?",
  "¿Qué señales de alarma debo vigilar?",
  "¿Es contagioso lo que tengo?",
  "¿Puedo seguir trabajando/estudiando con estos síntomas?",
  "¿Qué alimentos debo evitar o consumir más?",
  "¿Cuánto tiempo suele durar esta condición?",
  "¿Necesito reposo absoluto o puedo hacer ejercicio leve?",
  "¿Qué debo decirle a mi médico en la próxima consulta?",
  "¿Hay alternativas naturales o caseras para mi malestar?",
  "¿Qué debo hacer si los síntomas empeoran?",
  "¿Puedo tomar mis medicamentos habituales?",
  "¿Es normal sentirme así?",
];

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
      <div className="flex gap-3 overflow-x-auto scrollbar-hide px-8 pl-0">
        {prompts?.map((prompt, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            disabled={isDisabled}
            className="whitespace-nowrap rounded-full cursor-pointer
                font-normal !text-[12.5px] hover:bg-gray-50
                "
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
