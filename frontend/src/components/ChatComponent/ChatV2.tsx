import React, { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "@/services/chatService";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Copy, Check, ArrowDown, Pencil } from "lucide-react";
import TypewriterEffect from "./TypewriterEffect";
import { Button } from "../ui/button";
import { useLanguage } from "@/hooks/use-language";

interface ChatV2Props {
  messages: ChatMessage[];
  userName: string | null;
  isLoading: boolean;
  streamingHtml: string | null;
  onEditLastUser?: (content: string) => void;
  // Inline edit controls for last user message
  isEditingLast?: boolean;
  onStartEditLast?: (content: string) => void;
  onSaveEditLast?: (content: string) => void;
  onCancelEditLast?: () => void;
  isBusy?: boolean;
  patient?: any; // Para acceder al idioma preferido
}

export const ChatV2: React.FC<ChatV2Props> = ({
  messages,
  userName,
  isLoading,
  streamingHtml,
  onEditLastUser,
  isEditingLast,
  onStartEditLast,
  onSaveEditLast,
  onCancelEditLast,
  isBusy,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [editDraft, setEditDraft] = useState<string>("");
  const editTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useLanguage();

  // Función simple para hacer scroll al final del chat
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    }
  }, []);

  // Scroll automático solo cuando se agrega un mensaje nuevo
  useEffect(() => {
    if (messages.length > 0) {
      // Delay simple para asegurar que el DOM esté listo
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [messages.length, scrollToBottom]);

  useEffect(() => {
    const el = editTextAreaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [editDraft, isEditingLast]);

  // Detectar si está cerca del final para mostrar el botón de scroll down
  const isNearBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 180;
  }, []);

  // Manejo del scroll del usuario para mostrar/ocultar el botón de scroll down
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Solo mostrar el botón si no está cerca del final
      setShowScrollDown(!isNearBottom());
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [isNearBottom]);

  const handleCopy = useCallback(async (content: string, id: string) => {
    try {
      // Extraer texto limpio del HTML si es necesario
      let textToCopy = content;

      // Si el contenido parece tener HTML, extraer solo el texto
      if (content.includes("<") && content.includes(">")) {
        // Crear un elemento temporal para extraer el texto
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = content;
        textToCopy = tempDiv.textContent || tempDiv.innerText || content;
      }

      await navigator.clipboard.writeText(textToCopy);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, []);

  const handleGoToBottom = () => {
    scrollToBottom();
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      <div ref={chatContainerRef} className="h-full overflow-y-auto pt-8 pb-24">
        {messages.length > 0 ? (
          <div className="flex flex-col gap-8 w-full">
            {(() => {
              const lastUserIdx = messages.map((m) => m.role).lastIndexOf("user");
              return messages.map((message, index) => {
                const isUser = message.role === "user";
                const isLast = index === messages.length - 1;
                const msgId = `${message.timestamp}-${index}`;
                const isCurrentlyStreaming = false;
                const isLastUserMessage = isUser && index === lastUserIdx;

                return (
                  <div key={msgId} className="group" data-message data-message-id={msgId}>
                    <div className="flex gap-3 w-full">
                      {!isUser && (
                        <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                          <AvatarImage src="/doctor_capybara.jpeg" />
                          <AvatarFallback className="bg-indigo-600 text-white text-xs">
                            🦫
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex-1">
                        <div
                          className={cn(
                            "rounded-2xl px-4 py-3 shadow-sm",
                            isUser
                              ? "bg-blue-600 text-white ml-auto w-fit" // Usuario: solo el ancho necesario
                              : "bg-white text-gray-900 border border-gray-200 mr-auto w-full md:max-w-[85%]" // IA: mobile=todo, desktop=máximo 85%
                          )}
                        >
                          {isUser ? (
                            <div className="whitespace-pre-wrap break-words">
                              {isLastUserMessage && isEditingLast ? (
                                <div className="space-y-2">
                                  <textarea
                                    ref={editTextAreaRef}
                                    className={cn(
                                      "rounded-md p-2 resize-none overflow-hidden",
                                      "text-gray-900 bg-white border border-gray-300",
                                      "focus:outline-none focus:ring-2  focus:ring-indigo-500/30",
                                      "text-base leading-relaxed",
                                      "min-h-[44px] max-h-[200px]",
                                      "box-border"
                                    )}
                                    rows={1}
                                    value={editDraft}
                                    onChange={(e) => setEditDraft(e.target.value)}
                                    disabled={isBusy}
                                    style={{ width: "100%", boxSizing: "border-box" }}
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={onCancelEditLast}
                                      disabled={isBusy}
                                    >
                                      {t("chatCancel")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => onSaveEditLast?.(editDraft)}
                                      disabled={isBusy || !editDraft.trim()}
                                    >
                                      {t("chatSave")}
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="text-base leading-relaxed">{message.content}</div>
                                  <div className="mt-2 flex gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopy(message.content, msgId)}
                                      className="h-8 px-3 text-white hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-105 cursor-pointer"
                                    >
                                      <Copy className="h-4 w-4 mr-1.5" /> {t("chatCopy")}
                                    </Button>
                                    {isLastUserMessage && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setEditDraft(message.content);
                                          onStartEditLast?.(message.content);
                                        }}
                                        disabled={isBusy}
                                        className="h-8 px-3 text-white hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-105 cursor-pointer"
                                      >
                                        <Pencil className="h-4 w-4 mr-1.5" /> {t("chatEdit")}
                                      </Button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <TypewriterEffect
                                content={message.content}
                                showTypingIndicator={false}
                              />

                              {!isCurrentlyStreaming && (
                                <div className="flex gap-2 pt-2 -mt-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-all duration-200 hover:scale-105 cursor-pointer"
                                    onClick={() => handleCopy(message.content, msgId)}
                                  >
                                    {copiedMessageId === msgId ? (
                                      <Check className="h-4 w-4 mr-1.5" />
                                    ) : (
                                      <Copy className="h-4 w-4 mr-1.5" />
                                    )}
                                    {t("chatCopy")}
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isUser && (
                        <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                          <AvatarFallback className="bg-blue-600 text-white text-xs">
                            {userName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                );
              });
            })()}

            {streamingHtml !== null && (
              <div className="flex gap-3 w-full" data-message data-message-id="streaming">
                <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                  <AvatarImage src="/doctor_capybara.jpeg" />
                  <AvatarFallback className="bg-indigo-600 text-white text-xs">🦫</AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm mr-auto max-w-[85%] md:max-w-[85%]">
                    <TypewriterEffect content={streamingHtml} showTypingIndicator={true} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 h-full py-12">
            <div className="bg-indigo-50 rounded-full p-6 mb-2">
              <span className="text-4xl">🦫</span>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">{t("chatWelcome")}</h3>
              <p className="text-base text-gray-500 max-w-md">{t("chatWelcomeDesc")}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
              <ArrowDown className="h-4 w-4 animate-bounce" />
              <span>{t("chatWriteMessage")}</span>
            </div>
          </div>
        )}
      </div>

      {/* Botón flotante para ir al final */}
      {showScrollDown && (
        <div className="absolute bottom-32 right-6 z-10">
          <Button
            onClick={handleGoToBottom}
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Se eliminó la burbuja superpuesta; el streaming se muestra inline al final de la lista */}
    </div>
  );
};
