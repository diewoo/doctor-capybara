import React, { useEffect, useRef, useState } from "react";
import { ChatMessage } from "@/services/chatService";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "../ui/avatar";
import {
  Loader,
  Copy,
  ThumbsDown,
  Trash2,
  Check,
  ArrowDown,
} from "lucide-react";
import TypewriterEffect from "./TypewriterEffect";
import { Button } from "../ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatV2Props {
  messages: ChatMessage[];
  userName: string | null;
  isLoading: boolean;
}

export const ChatV2: React.FC<ChatV2Props> = ({
  messages,
  userName,
  isLoading,
}) => {
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  // Ref para saber si el usuario estaba al fondo antes del nuevo mensaje
  const wasAtBottomRef = useRef(true);
  const [scrollDebug, setScrollDebug] = useState({
    scrollTop: 0,
    scrollHeight: 0,
    clientHeight: 0,
  });

  // Detectar si el usuario está al fondo
  const isUserAtBottom = () => {
    if (!chatContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 20;
  };

  // Actualizar userScrolled solo por scroll del usuario
  const handleScroll = () => {
    setUserScrolled(!isUserAtBottom());
  };

  // Guardar si el usuario estaba al fondo antes de que cambien los mensajes
  useEffect(() => {
    wasAtBottomRef.current = isUserAtBottom();
    // eslint-disable-next-line
  }, [messages.length]);

  // Autoscroll solo si el usuario estaba al fondo antes del nuevo mensaje
  useEffect(() => {
    if (wasAtBottomRef.current) {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    }
    // eslint-disable-next-line
  }, [messages]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      // Forzar el cálculo inicial
      handleScroll();
      return () => container.removeEventListener("scroll", handleScroll);
    }
    // eslint-disable-next-line
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(messageId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      <div
        ref={chatContainerRef}
        className="flex max-h-[calc(100vh-10.5rem)] flex-1 flex-col gap-4 p-3 overflow-y-auto pt-8 pb-20"
      >
        {messages && messages.length > 0 ? (
          <div className="flex flex-col gap-8 w-full">
            {messages.map((message, index) => {
              const isUserMessage = message.role === "user";
              const isLastMessage = index === messages.length - 1;
              const messageId = `${message.timestamp}-${index}`;

              return (
                <div
                  key={messageId}
                  className={cn("flex items-end group animate-fade-in", {
                    "justify-end": isUserMessage,
                  })}
                >
                  <div
                    className={cn(
                      "flex flex-col space-y-2 text-base max-w-lg mx-2",
                      {
                        "order-1 items-end": isUserMessage,
                        "order-2 items-start !max-w-4xl": !isUserMessage,
                      }
                    )}
                  >
                    <div
                      className={cn("flex gap-2", {
                        "items-end": isUserMessage,
                        "items-start": !isUserMessage,
                      })}
                    >
                      {!isUserMessage && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="shrink-0 bg-gray-200 text-sm">
                            AI
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div
                        className={cn(
                          "px-4 py-2 rounded-lg inline-block shadow-sm group",
                          {
                            "bg-black/80 text-white": isUserMessage,
                            "bg-white border border-gray-200 text-gray-900":
                              !isUserMessage,
                            relative: !isUserMessage,
                          }
                        )}
                      >
                        {isUserMessage ? (
                          <div
                            className="space-y-4"
                            dangerouslySetInnerHTML={{
                              __html: message.content
                                .replace(/```html\n|\n```/g, "")
                                .replace(
                                  /<div style="margin:10px"><\/div>/g,
                                  ""
                                )
                                .replace(
                                  /<div style="margin:10px">/g,
                                  '<div class="mb-4">'
                                )
                                .replace(
                                  /<strong>/g,
                                  '<strong class="font-semibold">'
                                )
                                .replace(
                                  /<h3>/g,
                                  '<h3 class="text-lg font-semibold mb-2">'
                                )
                                .replace(
                                  /<ul>/g,
                                  '<ul class="list-disc pl-6 space-y-2">'
                                )
                                .replace(/<p>/g, '<p class="mb-2">'),
                            }}
                          />
                        ) : isLastMessage ? (
                          <div className="min-w-[200px]">
                            <TypewriterEffect
                              content={message.content}
                              onComplete={() => {
                                setIsTyping(false);
                                scrollToBottom();
                              }}
                              onUpdate={() => {
                                if (!isTyping) setIsTyping(true);
                                if (!userScrolled) {
                                  scrollToBottom();
                                }
                              }}
                            />
                            {isTyping && (
                              <div className="flex gap-1 mt-2">
                                <div
                                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                                  style={{ animationDelay: "0ms" }}
                                />
                                <div
                                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                                  style={{ animationDelay: "150ms" }}
                                />
                                <div
                                  className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                                  style={{ animationDelay: "300ms" }}
                                />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="space-y-4"
                            dangerouslySetInnerHTML={{
                              __html: message.content
                                .replace(/```html\n|\n```/g, "")
                                .replace(
                                  /<div style="margin:10px"><\/div>/g,
                                  ""
                                )
                                .replace(
                                  /<div style="margin:10px">/g,
                                  '<div class="mb-4">'
                                )
                                .replace(
                                  /<strong>/g,
                                  '<strong class="font-semibold">'
                                )
                                .replace(
                                  /<h3>/g,
                                  '<h3 class="text-lg font-semibold mb-2">'
                                )
                                .replace(
                                  /<ul>/g,
                                  '<ul class="list-disc pl-6 space-y-2">'
                                )
                                .replace(/<p>/g, '<p class="mb-2">'),
                            }}
                          />
                        )}

                        {/* {!isUserMessage && (
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleCopy(message.content, messageId)
                                  }
                                >
                                  {copiedMessageId === messageId ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <Copy className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Copiar mensaje</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <ThumbsDown className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>No me gusta esta respuesta</p>
                              </TooltipContent>
                            </Tooltip>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80">
                                <div className="space-y-4">
                                  <h4 className="font-medium">
                                    ¿Eliminar mensaje?
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Esta acción no se puede deshacer.
                                  </p>
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm">
                                      Cancelar
                                    </Button>
                                    <Button
                                      variant="default"
                                      size="sm"
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Eliminar
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        )} */}
                      </div>

                      {isUserMessage && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="shrink-0 bg-black/80 text-white text-sm">
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
          <div className="flex flex-col items-center justify-center gap-2">
            <span className="text-3xl mb-2">💬</span>
            <span className="text-base text-gray-400">
              ¡Comienza la conversación con tu asistente médico!
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatV2;
