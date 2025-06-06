import React, { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import { ChatV2 } from "./ChatV2";
import ChatInputV2 from "./ChatInputV2";
import PatientInsightSuggest from "./PatientInsightSuggest";

interface ChatComponentProps {
  patientId: string;
  userName: string;
}

const ChatComponent: React.FC<ChatComponentProps> = ({
  patientId,
  userName,
}) => {
  const { conversation, sendMessage, isLoading, isSending } =
    useChat(patientId);
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

  return (
    <div className="flex flex-col h-full p-3.5">
      <div className="flex-1 overflow-y-auto px-4 pb-2">
        <ChatV2
          messages={conversation || []}
          userName={userName}
          isLoading={isLoading || isSending}
        />
      </div>
      {/* Área fija de sugerencias */}
      <div className="border-t px-4 pt-2">
        <PatientInsightSuggest
          isDisabled={isLoading || isSending || isDisabled}
          setInput={setInput}
          onSubmit={handleSendMessage}
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
