import React from "react";
import { useLanguage } from "@/hooks/use-language";

interface TypewriterEffectProps {
  content: string;
  showTypingIndicator?: boolean;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  content,
  showTypingIndicator = false,
}) => {
  const { t } = useLanguage();
  // Función simple para formatear HTML
  const formatHtml = (html: string) => {
    return html
      .replace(/```html\n|\n```/g, "")
      .replace(/<div style="margin:10px"><\/div>/g, "")
      .replace(/<div style="margin:10px">/g, '<div class="mb-4">')
      .replace(/<strong>/g, '<strong class="font-semibold">')
      .replace(/<h3>/g, '<h3 class="text-lg font-semibold mb-2">')
      .replace(/<ul>/g, '<ul class="list-disc pl-6 space-y-2">')
      .replace(/<p>/g, '<p class="mb-2">');
  };

  // Función simple para sanitizar HTML
  const sanitizeHtml = (html: string) => {
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
  };

  // Procesar el contenido de manera simple
  const processContent = (content: string) => {
    if (!content) return "";

    // Solo procesar HTML si parece tener etiquetas
    if (content.includes("<") && content.includes(">")) {
      return sanitizeHtml(formatHtml(content));
    }

    // Si es texto plano, solo hacer line breaks
    return content.replace(/\n/g, "<br>");
  };

  return (
    <div className="space-y-2">
      <div
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{
          __html: processContent(content),
        }}
      />
      {showTypingIndicator && (
        <div className="flex items-center gap-2 text-gray-500">
          <span className="inline-block w-0.5 h-4 bg-blue-500 animate-pulse ml-1 rounded" />
          {!content && <span className="text-sm">{t("generatingResponse")}</span>}
        </div>
      )}
    </div>
  );
};

export default TypewriterEffect;
