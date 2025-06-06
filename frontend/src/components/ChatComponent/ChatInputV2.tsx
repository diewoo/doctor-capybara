import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizontal, Loader2, Sparkles } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !isLoading && !disabled) {
      onSendMessage(value.trim());
      setValue("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "44px";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "44px";
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = scrollHeight + "px";
    }
  }, [value]);

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-end gap-2 p-4 border-t bg-white/80 backdrop-blur-sm shadow-[0_-2px_4px_-1px_rgba(0,0,0,0.03)]"
    >
      <div className="relative flex-1">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta lo que quieras..."
          className={cn(
            "min-h-[44px] max-h-[200px] pr-12 transition-all duration-200",
            "focus:ring-2 focus:ring-indigo-500/20",
            "placeholder:text-gray-400",
            "resize-none",
            "rounded-xl border-gray-200/80",
            "shadow-[0_1px_2px_0_rgba(0,0,0,0.03)] hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.05)]",
            "bg-white/90",
            "text-gray-700"
          )}
          disabled={isLoading || disabled}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          {value.length > 0 && (
            <span className="text-xs text-gray-400 animate-fade-in bg-white/50 px-2 py-0.5 rounded-full">
              {value.length} caracteres
            </span>
          )}
        </div>
      </div>
      <Button
        type="submit"
        size="icon"
        disabled={!value.trim() || isLoading || disabled}
        className={cn(
          "h-10 w-10 shrink-0 transition-all duration-200",
          "hover:scale-105 active:scale-95",
          "disabled:opacity-50 disabled:hover:scale-100",
          "bg-indigo-600 hover:bg-indigo-700",
          "shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] hover:shadow-[0_2px_4px_0_rgba(0,0,0,0.1)]",
          "rounded-xl"
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        ) : (
          <SendHorizontal className="h-5 w-5 text-white" />
        )}
      </Button>
    </form>
  );
};

export default ChatInputV2;
