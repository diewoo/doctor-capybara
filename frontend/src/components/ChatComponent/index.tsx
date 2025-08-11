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
  const pendingDeltaRef = React.useRef<string>("");
  const rafRef = React.useRef<number | null>(null);
  const [isEditingLast, setIsEditingLast] = useState(false);

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
      // Cancelar stream previo si existe
      streamAbortRef.current?.();
      streamAbortRef.current = streamMessage(content, {
        onDelta: (delta: string) => {
          pendingDeltaRef.current += delta;
          if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(() => {
              const chunk = pendingDeltaRef.current;
              pendingDeltaRef.current = "";
              setStreamingHtml((prev) => (prev ?? "") + chunk);
              rafRef.current = null;
            });
          }
        },
        onDone: async () => {
          if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          pendingDeltaRef.current = "";
          await refetchConversation();
          streamAbortRef.current = null;
          setStreamingHtml(null);
          setPendingUserMessage(null);
          setIsDisabled(false);
          setIsEditingLast(false);
        },
        onError: (err) => {
          console.error("Stream error:", err);
          if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          pendingDeltaRef.current = "";
          streamAbortRef.current = null;
          setStreamingHtml(null);
          setPendingUserMessage(null);
          setIsDisabled(false);
          setIsEditingLast(false);
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSendEdit = async (content: string) => {
    // Cancelar cualquier stream en curso y preparar streaming nuevo
    streamAbortRef.current?.();
    streamAbortRef.current = null;
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    pendingDeltaRef.current = "";
    setStreamingHtml("");
    setInput("");

    try {
      streamAbortRef.current = streamEditLastMessage(content, {
        onDelta: (delta: string) => {
          pendingDeltaRef.current += delta;
          if (rafRef.current == null) {
            rafRef.current = requestAnimationFrame(() => {
              const chunk = pendingDeltaRef.current;
              pendingDeltaRef.current = "";
              setStreamingHtml((prev) => (prev ?? "") + chunk);
              rafRef.current = null;
            });
          }
        },
        onDone: async () => {
          if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          pendingDeltaRef.current = "";
          await refetchConversation();
          streamAbortRef.current = null;
          setStreamingHtml(null);
          setPendingUserMessage(null);
          setIsEditingLast(false);
        },
        onError: (err: unknown) => {
          console.error("Edit stream error:", err);
          if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
          pendingDeltaRef.current = "";
          streamAbortRef.current = null;
          setStreamingHtml(null);
          setIsEditingLast(false);
        },
      });
    } catch (error) {
      console.error("Error starting edit stream:", error);
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
              {patient?.title || t("chatYourConsultation")}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {isLoading || isSending || streamingHtml !== null
                ? t("chatDoctorTyping")
                : t("chatReadyToHelp")}
            </div>
          </div>
          <div className="ml-auto">
            <ProfileDrawer patient={patient} onQueueUpdate={() => {}} />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 px-4 pb-2">
        <ChatV2
          messages={allMessages as any}
          userName={userName}
          isLoading={isLoading || isSending || streamingHtml !== null}
          streamingHtml={streamingHtml}
          isEditingLast={isEditingLast}
          isBusy={isLoading || isSending || streamingHtml !== null}
          onStartEditLast={(content) => {
            // Prefill input solo como backup; el edit es inline
            setInput(content);
            setIsEditingLast(true);
            // Cancelar stream si estaba en curso
            streamAbortRef.current?.();
            streamAbortRef.current = null;
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            pendingDeltaRef.current = "";
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

      {/* Área fija de input */}
      <div className="px-4 pt-2 pb-2 border-t">
        <ChatInputV2
          onSendMessage={handleSendMessage}
          onSendEdit={isEditingLast ? handleSendEdit : undefined}
          isLoading={isLoading || isSending || streamingHtml !== null}
          disabled={isDisabled}
          value={input}
          setValue={setInput}
          onStop={() => {
            streamAbortRef.current?.();
            streamAbortRef.current = null;
            if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            pendingDeltaRef.current = "";
            setStreamingHtml(null);
            setIsDisabled(false);
            setIsEditingLast(false);
          }}
        />
      </div>

      {/* Área de sugerencias debajo del input (opcional) */}
      {Array.isArray(conversation) && conversation.length > 0 && (
        <div className="px-4 pt-2 pb-4">
          <div className="text-[11px] uppercase tracking-wide text-gray-500 mb-1 px-2">
            {t("chatSuggestedResponses")}
          </div>
          <PatientInsightSuggest
            isDisabled={isLoading || isSending || streamingHtml !== null || isDisabled}
            setInput={setInput}
            isProcessing={isLoading || isSending || streamingHtml !== null}
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
