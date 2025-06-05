import React, { useState } from "react";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import PatientInsightSuggest from "./PatientInsightSuggest";
import { useChat } from "@/hooks/use-chat";

interface PropsType {
  patientId: string;
  userName: string | null;
}

const ChatComponent = (props: PropsType) => {
  const { patientId, userName } = props;
  const { conversation, isLoading, sendMessage, isSending, patient } =
    useChat(patientId);
  const [input, setInput] = useState("");
  const [isSuggestionPending, setIsSuggestionPending] = useState(false);

  // Custom sendMessage handler to block input when suggestion is sent
  const handleSendMessage = (message: string) => {
    setIsSuggestionPending(true);
    sendMessage(message);
  };

  // Detect when sending is done to unblock input
  React.useEffect(() => {
    if (!isSending && isSuggestionPending) {
      setIsSuggestionPending(false);
      setInput("");
    }
  }, [isSending, isSuggestionPending]);

  // Get patient context (htmlDescription) if available
  const htmlDescription =
    patient?.data?.htmlDescription ||
    "<div class='text-gray-400'>Sin contexto disponible.</div>";
  const patientTitle = patient?.data?.title || "Contexto del Paciente";

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-gray-100 py-8 px-2">
      <div className="w-full max-w-6xl flex flex-row h-[80vh] rounded-2xl shadow-lg border border-gray-200 bg-white overflow-hidden">
        {/* Contexto del paciente a la izquierda */}
        {/* <div className="hidden md:flex flex-col w-1/3 border-r bg-gray-50 p-6 overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">{patientTitle}</h2>
          <div
            className="text-sm leading-relaxed space-y-4 [&>p]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>h1]:text-xl [&>h1]:font-bold [&>h2]:text-lg [&>h2]:font-semibold [&>h3]:text-base [&>h3]:font-medium"
            dangerouslySetInnerHTML={{ __html: htmlDescription }}
          />
        </div> */}
        {/* Chat a la derecha */}
        <div className="flex-1 flex flex-col h-full">
          {/* Área de mensajes */}
          <div className="flex-1 flex flex-col justify-end bg-gray-50 rounded-b-xl min-h-[300px] px-4 py-6">
            {(!conversation?.data || conversation?.data.length === 0) &&
            !isLoading ? (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400 select-none">
                <span className="text-3xl mb-2">💬</span>
                <span className="text-base">
                  ¡Comienza la conversación con tu asistente médico!
                </span>
              </div>
            ) : (
              <ChatMessages
                userName={userName}
                data={conversation}
                isLoading={isLoading}
              />
            )}
          </div>
          {/* Input fijo abajo */}
          <div className="border-t bg-white px-4 py-2 shadow-sm">
            <ChatInput
              patientId={patientId}
              isDisabled={isLoading || isSending || isSuggestionPending}
              onSendMessage={sendMessage}
              input={input}
              setInput={setInput}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;
