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
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollTop = useRef(0);
  const [editDraft, setEditDraft] = useState("");
  const editTextAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const el = editTextAreaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [editDraft, isEditingLast]);

  // Función simple para ir al final
  const scrollToBottom = useCallback((smooth = true) => {
    const container = chatContainerRef.current;
    if (!container) return;

    const scrollOptions: ScrollToOptions = {
      top: container.scrollHeight,
      behavior: smooth ? "smooth" : "instant",
    };

    container.scrollTo(scrollOptions);
  }, []);

  // Detectar si está cerca del final
  const isNearBottom = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return true;

    const { scrollTop, scrollHeight, clientHeight } = container;
    return scrollHeight - scrollTop - clientHeight < 180;
  }, []);

  // Auto-scroll cuando hay nuevos mensajes
  useEffect(() => {
    // Scroll automático solo si el usuario está cerca del final
    if (isNearBottom()) {
      requestAnimationFrame(() => {
        scrollToBottom(false);
      });
    }
  }, [messages.length, scrollToBottom, isNearBottom]);

  // Manejo del scroll del usuario
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const currentScrollTop = container.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTop.current;
      lastScrollTop.current = currentScrollTop;

      // Detectar si el usuario está scrolleando manualmente
      if (isScrollingUp || !isNearBottom()) {
        setIsUserScrolling(true);
        setShowScrollDown(true);

        // Reset después de un tiempo sin scroll
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        scrollTimeoutRef.current = setTimeout(() => {
          if (isNearBottom()) {
            setIsUserScrolling(false);
            setShowScrollDown(false);
          }
        }, 1500);
      } else {
        // Si está cerca del final, permitir auto-scroll
        setIsUserScrolling(false);
        setShowScrollDown(false);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isNearBottom]);

  const handleCopy = useCallback(async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, []);

  const handleGoToBottom = () => {
    setIsUserScrolling(false);
    setShowScrollDown(false);
    scrollToBottom(true);
  };

  const formatHtml = useCallback((content: string) => {
    return content
      .replace(/```html\n|\n```/g, "")
      .replace(/<div style="margin:10px"><\/div>/g, "")
      .replace(/<div style="margin:10px">/g, '<div class="mb-4">')
      .replace(/<strong>/g, '<strong class="font-semibold">')
      .replace(/<h3>/g, '<h3 class="text-lg font-semibold mb-2">')
      .replace(/<ul>/g, '<ul class="list-disc pl-6 space-y-2">')
      .replace(/<p>/g, '<p class="mb-2">');
  }, []);

  const sanitizeHtml = useCallback((html: string) => {
    let safe = html
      .replace(/<\/(?:script|style|iframe)>/gi, "")
      .replace(/<(?:script|style|iframe)[^>]*>/gi, "")
      .replace(/ on[a-z]+="[^"]*"/gi, "")
      .replace(/ on[a-z]+='[^']*'/gi, "");

    safe = safe
      .replace(/<(div|p|ul|li|strong)([^>]*)>/gi, "<$1>")
      .replace(/<(?!\/?(?:div|p|ul|li|strong)\b)[^>]*>/gi, (m) =>
        m.replace(/</g, "&lt;").replace(/>/g, "&gt;")
      );

    return safe;
  }, []);

  return (
    <div className="flex flex-col h-full w-full relative">
      <div ref={chatContainerRef} className="h-full overflow-y-auto p-3 pt-8 pb-24">
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
                  <div
                    key={msgId}
                    className={cn("flex items-start group", {
                      "justify-end": isUser,
                    })}
                  >
                    <div
                      className={cn(
                        "flex flex-col space-y-2 text-base max-w-full md:max-w-2xl lg:max-w-4xl mx-2 md:mx-8",
                        {
                          "order-1 items-end": isUser,
                          "order-2 items-start": !isUser,
                        }
                      )}
                    >
                      <div className="flex gap-3 items-start">
                        {!isUser && (
                          <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                            <AvatarImage src="/doctor_capybara.jpeg" alt="Doctor Capybara" />
                            <AvatarFallback>🦫</AvatarFallback>
                          </Avatar>
                        )}

                        <div
                          className={cn("px-4 py-3 rounded-lg shadow-sm relative", {
                            "bg-blue-600 text-white": isUser,
                            "bg-gray-100 text-gray-900": !isUser,
                          })}
                        >
                          {isUser ? (
                            <div className="whitespace-pre-wrap break-words relative">
                              {isLastUserMessage && isEditingLast ? (
                                <div className="space-y-2">
                                  <textarea
                                    ref={editTextAreaRef}
                                    className={cn(
                                      "w-full rounded-md p-2 resize-none overflow-hidden",
                                      "text-gray-900 bg-white border border-gray-300",
                                      "focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                                    )}
                                    rows={1}
                                    value={editDraft}
                                    onChange={(e) => setEditDraft(e.target.value)}
                                    disabled={isBusy}
                                  />
                                  <div className="flex gap-2 justify-end opacity-100 transition-opacity">
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
                                  <div>{message.content}</div>
                                  <div
                                    className={cn(
                                      "mt-2 -mb-1 flex gap-2 justify-end",
                                      "opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                    )}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleCopy(message.content, msgId)}
                                      className="h-7 px-2 border-blue-200 text-white/90 bg-blue-700 hover:bg-blue-700/90"
                                    >
                                      <Copy className="h-3.5 w-3.5 mr-1" /> {t("chatCopy")}
                                    </Button>
                                    {isLastUserMessage && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditDraft(message.content);
                                          onStartEditLast?.(message.content);
                                        }}
                                        disabled={isBusy}
                                        className="h-7 px-2 border-blue-200 text-white/90 bg-blue-700 hover:bg-blue-700/90"
                                      >
                                        <Pencil className="h-3.5 w-3.5 mr-1" /> {t("chatEdit")}
                                      </Button>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div
                              className="prose prose-sm max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: sanitizeHtml(formatHtml(message.content)),
                              }}
                            />
                          )}
                          {!isUser && !isCurrentlyStreaming && (
                            <div className="mt-2 -mb-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 hover:bg-primary cursor-pointer"
                                onClick={() => handleCopy(message.content, msgId)}
                              >
                                {copiedMessageId === msgId ? (
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5 mr-1" />
                                )}
                                {t("chatCopy")}
                              </Button>
                            </div>
                          )}
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
                  </div>
                );
              });
            })()}

            {streamingHtml !== null &&
              (streamingHtml.length === 0 ? (
                <div className={cn("flex items-start group")}>
                  <div
                    className={cn(
                      "flex flex-col space-y-2 text-base max-w-full md:max-w-2xl lg:max-w-4xl mx-2 md:mx-8",
                      { "order-2 items-start": true }
                    )}
                  >
                    <div className="flex gap-3 items-start">
                      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                        <AvatarImage src="/doctor_capybara.jpeg" alt="Doctor Capybara" />
                        <AvatarFallback>🦫</AvatarFallback>
                      </Avatar>
                      <div className="px-4 py-3 rounded-lg shadow-sm bg-gray-100 text-gray-500">
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
                          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn("flex items-start group")}>
                  <div
                    className={cn(
                      "flex flex-col space-y-2 text-base max-w-full md:max-w-2xl lg:max-w-4xl mx-2 md:mx-8",
                      { "order-2 items-start": true }
                    )}
                  >
                    <div className="flex gap-3 items-start">
                      <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                        <AvatarImage src="/doctor_capybara.jpeg" alt="Doctor Capybara" />
                        <AvatarFallback>🦫</AvatarFallback>
                      </Avatar>
                      <div
                        className={cn(
                          "px-4 py-3 rounded-lg shadow-sm relative bg-gray-100 text-gray-900"
                        )}
                      >
                        <div className="min-w-[200px]">
                          <TypewriterEffect
                            content={sanitizeHtml(formatHtml(streamingHtml))}
                            showTypingIndicator
                            onUpdate={() => {
                              if (isNearBottom()) {
                                scrollToBottom(false);
                              }
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
