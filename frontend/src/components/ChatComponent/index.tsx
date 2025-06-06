import React, { useState } from "react";
import { useChat } from "@/hooks/use-chat";
import ChatV2 from "./ChatV2";
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
      <ChatV2
        messages={conversation || []}
        userName={userName}
        isLoading={isLoading || isSending}
      />
      <PatientInsightSuggest
        isDisabled={isLoading || isSending || isDisabled}
        setInput={setInput}
        onSubmit={handleSendMessage}
      />
      <ChatInputV2
        onSendMessage={handleSendMessage}
        isLoading={isLoading || isSending}
        disabled={isDisabled}
        value={input}
        setValue={setInput}
      />
    </div>
  );
};

export default ChatComponent;
