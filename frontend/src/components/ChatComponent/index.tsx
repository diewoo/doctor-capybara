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
import { useLanguage } from "@/hooks/use-language";

interface ChatComponentProps {
  patientId: string;
  userName: string;
  initialHtml?: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({ patientId, userName, initialHtml }) => {
  const { t } = useLanguage();
  const {
    conversation,
    sendMessage,
    streamMessage,
    streamEditLastMessage,
    refetchConversation,
    isLoading,
    isSending,
    patient,
  } = useChat(patientId);
  const [isDisabled, setIsDisabled] = useState(false);
  const [input, setInput] = useState("");

  // Estado local para mostrar mensajes inmediatamente
  const [pendingUserMessage, setPendingUserMessage] = useState<any>(null);

  const [streamingHtml, setStreamingHtml] = useState<string | null>(null);
  const streamAbortRef = React.useRef<null | (() => void)>(null);
  const [isEditingLast, setIsEditingLast] = useState(false);

  // Acumular chunks hasta que esté completo
  const accumulatedChunksRef = React.useRef<string>("");

  // Estado para mostrar que se está generando la respuesta
  const [isGenerating, setIsGenerating] = useState(false);

  // Estado para manejar errores
  const [error, setError] = useState<string | null>(null);

  // Función para limpiar chunks acumulados de manera inteligente
  const cleanAccumulatedChunks = (): string => {
    const dirtyText = accumulatedChunksRef.current;
    if (!dirtyText) return "";

    let cleanedText = dirtyText;

    // Caso 1: Texto completo que empieza con JSON válido
    if (cleanedText.startsWith('{"response":')) {
      try {
        const parsed = JSON.parse(cleanedText);
        if (parsed.response) {
          return parsed.response;
        }
      } catch {
        // Si no se puede parsear, continuar con la limpieza normal
      }
    }

    // Caso 2: Texto que contiene JSON parcial con {"response":
    if (cleanedText.includes('{"response":')) {
      const responseStart = cleanedText.indexOf('"response":') + 11;
      if (responseStart < cleanedText.length) {
        const afterResponse = cleanedText.substring(responseStart);
        // Remover comillas, comas, espacios y caracteres de control iniciales
        cleanedText = afterResponse.replace(/^["\s,}\]]+/, "");
      }
    }

    // Caso 3: Texto que contiene "response:" (sin llaves)
    if (cleanedText.includes('"response":')) {
      const responseStart = cleanedText.indexOf('"response":') + 11;
      if (responseStart < cleanedText.length) {
        const afterResponse = cleanedText.substring(responseStart);
        // Remover comillas, espacios y caracteres de control iniciales
        cleanedText = afterResponse.replace(/^["\s]+/, "");
      }
    }

    // Caso 4: Remover caracteres de control JSON al inicio
    cleanedText = cleanedText.replace(/^[{"\s,}\]:]+/, "");

    // Caso 5: Remover caracteres de control JSON al final
    cleanedText = cleanedText.replace(/[{"\s,}\]:]+$/, "");

    // Limpiar markdown JSON
    if (cleanedText.includes("```json")) {
      cleanedText = cleanedText.replace(/```json\s*/, "").replace(/\s*```$/, "");
    }

    // Limpiar markdown general
    if (cleanedText.includes("```")) {
      cleanedText = cleanedText.replace(/```\s*/, "").replace(/\s*```$/, "");
    }

    return cleanedText;
  };

  // Abort stream on unmount (cleanup)
  React.useEffect(() => {
    return () => {
      streamAbortRef.current?.();
    };
  }, []);

  const handleSendMessage = async (content: string) => {
    // 1. PRIMERO: si NO es edición, mostramos mensaje del usuario inmediatamente
    if (!isEditingLast) {
      const userMessage = {
        role: "user",
        content: content,
        timestamp: new Date().toISOString(),
        id: Date.now().toString(),
      };
      setPendingUserMessage(userMessage);
    }
    setInput("");

    try {
      // 2. Iniciar streaming inmediato
      setStreamingHtml("");
      setIsGenerating(true); // Mostrar que se está generando
      // Limpiar refs de chunks
      accumulatedChunksRef.current = "";
      // Cancelar stream previo si existe
      streamAbortRef.current?.();
      streamAbortRef.current = streamMessage(content, {
        onDelta: (delta: string) => {
          // Acumular chunks sin mostrar nada hasta que esté completo
          accumulatedChunksRef.current += delta;
        },
        onDone: async () => {
          // Ahora que está completo, limpiar y mostrar la respuesta
          const finalCleanedText = cleanAccumulatedChunks();

          // Ocultar estado de generación
          setIsGenerating(false);

          // Mostrar la respuesta final limpia
          if (finalCleanedText && finalCleanedText.trim()) {
            setStreamingHtml(finalCleanedText);
            // Esperar un momento para que el usuario vea la respuesta
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Limpiar refs de chunks
          accumulatedChunksRef.current = "";
          await refetchConversation();
          streamAbortRef.current = null;
          setStreamingHtml(null);
          setPendingUserMessage(null);
          setIsDisabled(false);
          setIsEditingLast(false);
        },
        onError: (err) => {
          console.error("Stream error:", err);
          // Mostrar error al usuario
          setError(
            "Lo sentimos, hubo un problema al procesar tu consulta. Por favor, inténtalo de nuevo."
          );
          // Ocultar estado de generación
          setIsGenerating(false);
          // Limpiar refs de chunks
          accumulatedChunksRef.current = "";
          streamAbortRef.current = null;
          setStreamingHtml(null);
          setPendingUserMessage(null);
          setIsDisabled(false);
          setIsEditingLast(false);
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setError(
        "Lo sentimos, hubo un problema al enviar tu mensaje. Por favor, inténtalo de nuevo."
      );
      setIsGenerating(false);
      setPendingUserMessage(null);
      setIsDisabled(false);
    }
  };

  const handleSendEdit = async (content: string) => {
    // Cancelar cualquier stream en curso y preparar streaming nuevo
    streamAbortRef.current?.();
    streamAbortRef.current = null;
    // Limpiar refs de chunks
    accumulatedChunksRef.current = "";
    setStreamingHtml("");
    setIsGenerating(true); // Mostrar que se está generando
    setInput("");

    try {
      streamAbortRef.current = streamEditLastMessage(content, {
        onDelta: (delta: string) => {
          // Acumular chunks sin mostrar nada hasta que esté completo
          accumulatedChunksRef.current += delta;
        },
        onDone: async () => {
          // Ahora que está completo, limpiar y mostrar la respuesta
          const finalCleanedText = cleanAccumulatedChunks();

          // Ocultar estado de generación
          setIsGenerating(false);

          // Mostrar la respuesta final limpia
          if (finalCleanedText && finalCleanedText.trim()) {
            setStreamingHtml(finalCleanedText);
            // Esperar un momento para que el usuario vea la respuesta
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          // Limpiar refs de chunks
          accumulatedChunksRef.current = "";
          await refetchConversation();
          streamAbortRef.current = null;
          setStreamingHtml(null);
          setPendingUserMessage(null);
          setIsEditingLast(false);
        },
        onError: (err: unknown) => {
          console.error("Edit stream error:", err);
          // Mostrar error al usuario
          setError(
            "Lo sentimos, hubo un problema al editar tu mensaje. Por favor, inténtalo de nuevo."
          );
          // Ocultar estado de generación
          setIsGenerating(false);
          // Limpiar refs de chunks
          accumulatedChunksRef.current = "";
          streamAbortRef.current = null;
          setStreamingHtml(null);
          setIsEditingLast(false);
        },
      });
    } catch (error) {
      console.error("Error starting edit stream:", error);
      setError(
        "Lo sentimos, hubo un problema al editar tu mensaje. Por favor, inténtalo de nuevo."
      );
      setIsGenerating(false);
      setIsEditingLast(false);
    }
  };

  // Combinar mensajes: conversación + mensaje pendiente del usuario
  const allMessages = React.useMemo(() => {
    // Base: conversación o HTML inicial
    let messages =
      conversation && conversation.length > 0
        ? [...conversation]
        : initialHtml
          ? [{ role: "ai", content: initialHtml, timestamp: new Date().toISOString() }]
          : [];

    // Si estamos editando el último mensaje del usuario, ocultamos la última respuesta del asistente (y cualquier posterior)
    if (isEditingLast && Array.isArray(messages) && messages.length > 0) {
      const lastUserIdx = messages.map((m: any) => m.role).lastIndexOf("user");
      if (lastUserIdx !== -1) {
        messages = messages.slice(0, lastUserIdx + 1);
      }
    }

    // Agregar mensaje pendiente del usuario si existe (solo en envío normal)
    if (pendingUserMessage && !isEditingLast) {
      messages = [...messages, pendingUserMessage];
    }

    return messages;
  }, [conversation, initialHtml, pendingUserMessage, isEditingLast]);

  return (
    <div className="flex flex-col h-full">
      {/* Header con título de caso y estado */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100 px-4 py-2">
        <div className="flex items-center gap-3">
          <img
            src="/doctor_capybara.jpeg"
            alt="Doctor Capybara"
            className="w-8 h-8 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {patient?.title || t("chatYourConsultation")}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {isGenerating
                ? t("chatReadyToHelp") // No mostrar "typing" cuando se está generando
                : isLoading || isSending || streamingHtml !== null
                  ? t("chatDoctorTyping")
                  : t("chatReadyToHelp")}
            </div>
          </div>
          <div className="ml-auto">
            <ProfileDrawer patient={patient} onQueueUpdate={() => {}} />
          </div>
        </div>
      </div>

      {/* Chat messages - área flexible */}
      <div className="flex-1 min-h-0 px-4">
        <ChatV2
          messages={allMessages as any}
          userName={userName}
          isLoading={isLoading || isSending || streamingHtml !== null}
          streamingHtml={streamingHtml}
          isGenerating={isGenerating}
          isEditingLast={isEditingLast}
          isBusy={isLoading || isSending || streamingHtml !== null || isGenerating}
          error={error}
          onClearError={() => setError(null)}
          onStartEditLast={(content) => {
            setInput(content);
            setIsEditingLast(true);
            streamAbortRef.current?.();
            streamAbortRef.current = null;
            setStreamingHtml(null);
          }}
          onCancelEditLast={() => {
            setIsEditingLast(false);
            setInput("");
          }}
          onSaveEditLast={(content) => {
            setIsEditingLast(true);
            handleSendEdit(content);
          }}
        />
      </div>

      {/* Input y sugerencias integrados en un solo contenedor */}
      <div className="bg-white">
        {/* Input principal */}
        <div className="px-4 py-2">
          <ChatInputV2
            onSendMessage={handleSendMessage}
            onSendEdit={isEditingLast ? handleSendEdit : undefined}
            isLoading={isLoading || isSending || streamingHtml !== null || isGenerating}
            disabled={isDisabled}
            value={input}
            setValue={setInput}
            onStop={() => {
              streamAbortRef.current?.();
              streamAbortRef.current = null;
              // Ocultar estado de generación
              setIsGenerating(false);
              // Limpiar refs de chunks
              accumulatedChunksRef.current = "";
              setStreamingHtml(null);
              setIsDisabled(false);
              setIsEditingLast(false);
            }}
          />
        </div>

        {/* Sugerencias integradas - solo mostrar si hay conversación */}
        {Array.isArray(conversation) && conversation.length > 0 && (
          <div className="px-4 pb-3">
            <PatientInsightSuggest
              isDisabled={
                isLoading || isSending || streamingHtml !== null || isGenerating || isDisabled
              }
              setInput={setInput}
              isProcessing={isLoading || isSending || streamingHtml !== null || isGenerating}
              prompts={buildContextualPrompts(patient?.info, patient?.preferredLanguage)}
              responseSuggestions={
                Array.isArray(conversation) && conversation.length > 0
                  ? conversation[conversation.length - 1]?.suggestions
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatComponent;

function buildContextualPrompts(
  info: any | undefined,
  language: "Español" | "English" = "Español"
): string[] {
  const { t } = useLanguage();

  if (language === "English") {
    return [
      String(t("promptAgeSymptom")),
      String(t("promptSleep")),
      String(t("promptMedication")),
      String(t("promptGoals")),
    ];
  }

  if (!info || typeof info !== "object") {
    return [
      String(t("promptAgeSymptom")),
      String(t("promptSleep")),
      String(t("promptMedication")),
      String(t("promptGoals")),
    ];
  }

  const prompts: string[] = [];
  if (!info.age) prompts.push(String(t("promptAgeSymptom")));
  const lifestyle = info.lifestyle || {};
  if (!lifestyle.sleepHabits) prompts.push(String(t("promptSleep")));
  if (!lifestyle.stressLevels) prompts.push(String(t("promptStress")));
  if (!info.medications) prompts.push(String(t("promptMedication")));
  if (!info.geneticFamilyHistory) prompts.push(String(t("promptFamilyHistory")));
  if (!info.personalGoals) prompts.push(String(t("promptGoals")));

  // fallback si hay pocos prompts
  if (prompts.length < 4) {
    prompts.push(
      String(t("promptHomeRemedies")),
      String(t("promptWhenToDoctor")),
      String(t("promptDuration"))
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
  const { t } = useLanguage();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="cursor-pointer">
          {String(t("chatYourProfile"))}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{String(t("chatYourProfile"))}</DrawerTitle>
          <DrawerDescription>{String(t("chatEditProfile"))}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs text-gray-600">{String(t("chatAge"))}</label>
            <Input
              placeholder={String(t("chatAgeExample"))}
              defaultValue={patient?.info?.age ?? ""}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-gray-600">{String(t("chatGender"))}</label>
            <Input
              placeholder={String(t("chatGenderExample"))}
              defaultValue={patient?.info?.gender ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-gray-600">{String(t("chatMedications"))}</label>
            <Textarea
              placeholder={String(t("chatMedExample"))}
              defaultValue={patient?.info?.medications ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-gray-600">{String(t("chatAllergies"))}</label>
            <Textarea
              placeholder={String(t("chatAllergiesExample"))}
              defaultValue={patient?.info?.allergies ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs text-gray-600">{String(t("chatSleepStress"))}</label>
            <Textarea
              placeholder={String(t("chatSleepExample"))}
              defaultValue={
                patient?.info?.lifestyle?.sleepHabits && patient?.info?.lifestyle?.stressLevels
                  ? `${patient.info.lifestyle.sleepHabits}; ${patient.info.lifestyle.stressLevels}`
                  : patient?.info?.lifestyle?.sleepHabits ||
                    patient?.info?.lifestyle?.stressLevels ||
                    ""
              }
            />
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">{String(t("chatClose"))}</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
