import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputV2Props {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  disabled?: boolean;
  value: string;
  setValue: (value: string) => void;
}

export const ChatInputV2: React.FC<ChatInputV2Props> = ({
  onSendMessage,
  isLoading,
  disabled = false,
  value,
  setValue,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading && !disabled) {
      onSendMessage(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-end gap-2 p-4 border-t bg-white"
    >
      <div className="relative flex-1">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu mensaje..."
          className="min-h-[44px] max-h-[200px] pr-12"
          disabled={isLoading || disabled}
        />
        <div className="absolute right-2 bottom-2 text-xs text-gray-400">
          {value.length > 0 && `${value.length} caracteres`}
        </div>
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={!value.trim() || isLoading || disabled}
        className="h-10 w-10 shrink-0"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <SendHorizontal className="h-5 w-5" />
        )}
      </Button>
    </form>
  );
};

export default ChatInputV2;
