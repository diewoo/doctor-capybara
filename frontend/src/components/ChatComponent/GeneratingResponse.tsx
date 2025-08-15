import React from "react";
import { useLanguage } from "@/hooks/use-language";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";

interface GeneratingResponseProps {
  className?: string;
}

export const GeneratingResponse: React.FC<GeneratingResponseProps> = ({ className }) => {
  const { t, language } = useLanguage();

  return (
    <div className={cn("flex gap-3 w-full", className)}>
      {/* Avatar del Doctor Capybara */}
      <div className="w-10 h-10 flex-shrink-0 mt-1">
        <Avatar className="w-10 h-10">
          <AvatarImage src="/doctor_capybara.jpeg" />
          <AvatarFallback className="bg-indigo-600 text-white text-xs">🦫</AvatarFallback>
        </Avatar>
      </div>

      {/* Contenedor simple como ChatGPT */}
      <div className="flex-1">
        <div className="bg-gray-50 rounded-2xl px-5 py-4 mr-auto max-w-[85%] md:max-w-[85%]">
          {/* Solo puntos animados simples - estilo ChatGPT */}
          <div className="flex gap-2">
            <div
              className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <div
              className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <div
              className="w-2.5 h-2.5 bg-gray-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneratingResponse;
