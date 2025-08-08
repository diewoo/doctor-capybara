import React, { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatV2 } from "./ChatV2";
import ChatInputV2 from "./ChatInputV2";
import PatientInsightSuggest from "./PatientInsightSuggest";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ChatComponentProps {
  patientId: string;
  userName: string;
  initialHtml?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ patientId, userName, initialHtml }) => {
  const { conversation, sendMessage, isLoading, isSending, patient } = useChat(patientId);
  const [isDisabled, setIsDisabled] = useState(false);
  const [input, setInput] = useState("");

  const handleSendMessage = async (content: string) => {
    setIsDisabled(true);
    try {
      sendMessage(content);
      setInput("");
    } finally {
      setIsDisabled(false);
    }
  };

  // Si no hay conversación aún, mostramos el HTML inicial como primer mensaje del bot
  const messagesWithWelcome =
    conversation && conversation.length > 0
      ? conversation
      : initialHtml
        ? [{ role: "ai", content: initialHtml, timestamp: new Date().toISOString() }]
        : [];

  return (
    <div className="flex flex-col h-full p-3.5">
      {/* Header con título de caso y estado */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-2 rounded-t-md">
        <div className="flex items-center gap-3">
          <img
            src="/doctor_capybara.jpeg"
            alt="Doctor Capybara"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {patient?.title || "Tu consulta"}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {isLoading || isSending ? "Doctor Capybara está escribiendo…" : "Listo para ayudarte"}
            </div>
          </div>
          <div className="ml-auto">
            <ProfileDrawer patient={patient} onQueueUpdate={() => {}} />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-2">
        <ChatV2
          messages={messagesWithWelcome as any}
          userName={userName}
          isLoading={isLoading || isSending}
        />
      </div>
      {/* Área fija de sugerencias */}
      <div className="border-t px-4 pt-2">
        <PatientInsightSuggest
          isDisabled={isLoading || isSending || isDisabled}
          setInput={setInput}
          isProcessing={isLoading || isSending}
          prompts={buildContextualPrompts(patient?.info)}
          responseSuggestions={
            Array.isArray(conversation) && conversation.length > 0
              ? conversation[conversation.length - 1]?.suggestions
              : undefined
          }
        />
      </div>

      {/* Área fija de input */}
      <div className="px-4 pt-2 pb-4">
        <ChatInputV2
          onSendMessage={handleSendMessage}
          isLoading={isLoading || isSending}
          disabled={isDisabled}
          value={input}
          setValue={setInput}
        />
      </div>
    </div>
  );
};

export default ChatComponent;

function buildContextualPrompts(info: any | undefined): string[] {
  if (!info || typeof info !== "object") {
    return [
      "Tengo X años y me siento [síntoma], ¿qué me recomiendas?",
      "No duermo bien por la tos, ¿qué puedo hacer en casa?",
      "Estoy tomando algo para la gripe, ¿qué debo tener en cuenta?",
      "Mis objetivos son [mejorar sueño/energía], ¿por dónde empiezo?",
    ];
  }

  const prompts: string[] = [];
  if (!info.age) prompts.push("Tengo [edad] años, ¿qué me recomiendas?");
  const lifestyle = info.lifestyle || {};
  if (!lifestyle.sleepHabits) prompts.push("No estoy durmiendo bien, ¿qué puedo hacer en casa?");
  if (!lifestyle.stressLevels)
    prompts.push("Siento estrés leve, ¿qué técnicas de relajación me sugieres?");
  if (!info.medications)
    prompts.push("Estoy tomando [nombre/dosis/frecuencia], ¿es adecuado mezclar con otras cosas?");
  if (!info.geneticFamilyHistory)
    prompts.push("Hay antecedentes en mi familia, ¿qué señales debería vigilar?");
  if (!info.personalGoals)
    prompts.push("Mis objetivos son [mejorar sueño/energía], ¿qué pasos simples puedo seguir?");

  // fallback si hay pocos prompts
  if (prompts.length < 4) {
    prompts.push(
      "¿Qué puedo hacer en casa para sentirme mejor?",
      "¿Cuándo debería acudir a un médico presencial?",
      "¿Cuánto tiempo suele durar esta molestia?"
    );
  }
  return prompts.slice(0, 6);
}

function ProfileDrawer({
  patient,
  onQueueUpdate,
}: {
  patient: any;
  onQueueUpdate: (data: any) => void;
}) {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm">
          Tu perfil
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Tu perfil</DrawerTitle>
          <DrawerDescription>
            Edita los datos que quieras compartir para personalizar las recomendaciones.
          </DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Edad</label>
            <Input placeholder="Ej. 31" defaultValue={patient?.info?.age ?? ""} />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">Género</label>
            <Input
              placeholder="Ej. femenino/masculino/no binario"
              defaultValue={patient?.info?.gender ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-gray-600">Medicaciones</label>
            <Textarea
              placeholder="Nombre / dosis / frecuencia"
              defaultValue={patient?.info?.medications ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-gray-600">Alergias</label>
            <Textarea
              placeholder="Medicamentos o alimentos a los que eres alérgico/a"
              defaultValue={patient?.info?.allergies ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-gray-600">Sueño y estrés</label>
            <Textarea
              placeholder="Hábitos de sueño y niveles de estrés"
              defaultValue={
                patient?.info?.lifestyle?.sleepHabits || patient?.info?.lifestyle?.stressLevels
                  ? `${patient?.info?.lifestyle?.sleepHabits || ""} | ${
                      patient?.info?.lifestyle?.stressLevels || ""
                    }`
                  : ""
              }
            />
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Cerrar</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
