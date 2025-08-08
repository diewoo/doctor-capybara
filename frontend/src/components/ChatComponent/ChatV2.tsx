import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { ChatMessage } from "@/services/chatService";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Copy, ThumbsDown, Trash2, Check, ArrowDown } from "lucide-react";
import TypewriterEffect from "./TypewriterEffect";
import { Button } from "../ui/button";

interface ChatV2Props {
  messages: ChatMessage[];
  userName: string | null;
  isLoading: boolean;
}

export const ChatV2: React.FC<ChatV2Props> = ({ messages, userName, isLoading }) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const wasAtBottomRef = useRef(true);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const isUserAtBottom = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return true;
    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollHeight - scrollTop - clientHeight < 20;
  }, []);

  const scrollToBottom = useCallback(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    wasAtBottomRef.current = isUserAtBottom();
  }, [messages.length, isUserAtBottom]);

  useEffect(() => {
    if (wasAtBottomRef.current) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const onScroll = () => {
      setShowScrollDown(!isUserAtBottom());
    };
    el.addEventListener("scroll", onScroll);
    onScroll();
    return () => {
      el.removeEventListener("scroll", onScroll);
    };
  }, [isUserAtBottom]);

  const handleCopy = useCallback(async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  }, []);

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
    // Whitelist simple: div, p, ul, li, strong
    // 1) Remove script/style/iframe and event handlers
    let safe = html
      .replace(/<\/(?:script|style|iframe)>/gi, "")
      .replace(/<(?:script|style|iframe)[^>]*>/gi, "")
      .replace(/ on[a-z]+="[^"]*"/gi, "")
      .replace(/ on[a-z]+='[^']*'/gi, "");

    // 2) Strip attributes from allowed tags
    safe = safe
      .replace(/<(div|p|ul|li|strong)([^>]*)>/gi, "<$1>")
      // 3) Remove any tag not in whitelist by escaping angle brackets
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
            {messages.map((message, index) => {
              const isUser = message.role === "user";
              const isLast = index === messages.length - 1;
              const msgId = `${message.timestamp}-${index}`;

              return (
                <div
                  key={msgId}
                  className={cn("flex items-end group animate-fade-in", {
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
                    <div className="flex gap-2 items-end">
                      {!isUser && (
                        <Avatar className="w-10 h-10">
                          <AvatarImage src="/doctor_capybara.jpeg" alt="Doctor Capybara" />
                        </Avatar>
                      )}

                      <div
                        className={cn("px-4 py-2 rounded-lg shadow-sm", {
                          "bg-black/80 text-white": isUser,
                          "bg-white border border-gray-200 text-gray-900 relative": !isUser,
                        })}
                      >
                        {isUser ? (
                          <div className="whitespace-pre-wrap break-words text-white/90">
                            {message.content}
                          </div>
                        ) : isLast ? (
                          <div className="min-w-[200px]">
                            <TypewriterEffect
                              content={sanitizeHtml(formatHtml(message.content))}
                              onComplete={() => {
                                scrollToBottom();
                              }}
                              onUpdate={() => {
                                if (!isUserAtBottom()) {
                                  scrollToBottom();
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="space-y-4"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml(formatHtml(message.content)),
                            }}
                          />
                        )}

                        {!isUser && (
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label="Copiar"
                              title="Copiar"
                              onClick={() => handleCopy(message.content, msgId)}
                            >
                              {copiedMessageId === msgId ? (
                                <Check className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </div>

                      {isUser && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-black/80 text-white text-sm">
                            {userName?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 h-full py-12">
            <div className="bg-indigo-50 rounded-full p-6 mb-2">
              <span className="text-4xl">🦫</span>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold text-gray-900">
                Bienvenido a tu asistente con el doctor capybara
              </h3>
              <p className="text-base text-gray-500 max-w-md">
                Estoy aquí para ayudarte con tus consultas médicas. ¿En qué puedo asistirte hoy?
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400 mt-4">
              <ArrowDown className="h-4 w-4 animate-bounce" />
              <span>Escribe tu mensaje abajo o usa las sugerencias para comenzar</span>
            </div>
          </div>
        )}
      </div>
      {/* FAB de "ir al final" removido temporalmente para estabilizar el autoscroll */}
    </div>
  );
};
