import { cn } from "@/lib/utils";
import { Loader, MessageSquareTextIcon } from "lucide-react";
import React from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import useScrollToBottom from "@/hooks/use-scroll-bottom";
import { ChatMessage } from "@/services/chatService";

interface PropType {
  userName: string | null;
  data: { success: boolean; data: ChatMessage[] } | undefined;
  isLoading: boolean;
}

const ChatMessages = (props: PropType) => {
  const { data, userName, isLoading } = props;

  const containerEndRef = useScrollToBottom([data]);

  const messages = data?.data || [];

  if (isLoading) {
    return (
      <div className="w-full flex justify-center gap-2 p-5">
        <Loader className="h-8 w-8 animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div
      className="
      flex max-h-[calc(100vh-10.5rem)] flex-1
      flex-col gap-4 p-3 overflow-y-auto pt-8 pb-20"
    >
      {messages && messages.length > 0 ? (
        <>
          {messages.map((message: ChatMessage, index: number) => {
            const isUserMessage = message.role === "user";

            return (
              <div
                key={`${message.timestamp}-${index}`}
                className={cn("flex items-end", {
                  "justify-end": isUserMessage,
                })}
              >
                <div
                  className={cn(
                    `flex flex-col space-y-2 text-base max-w-lg mx-2`,
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
                      className={cn("px-4 py-2 rounded-lg inline-block", {
                        "bg-black/80 text-white": isUserMessage,
                        "bg-gray-50 text-gray-900": !isUserMessage,
                      })}
                    >
                      <div
                        key={`${message.timestamp}-${index}`}
                        dangerouslySetInnerHTML={{ __html: message.content }}
                      />
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
        </>
      ) : (
        <div
          className="flex flex-col items-center 
          justify-center gap-2"
        >
          <MessageSquareTextIcon className="w-8 h-8" />
          <h3 className="font-semibold text-lg">
            Your Medical Assistant is Ready!
          </h3>
          <p className="text-gray-500 tex-sm">
            Get medical insights and advice
          </p>
        </div>
      )}

      <br />
      <br />
      <br />
      <div ref={containerEndRef} />
    </div>
  );
};

export default ChatMessages;
