import React, { useEffect, useState } from "react";

interface TypewriterEffectProps {
  content: string;
  onComplete?: () => void;
  onUpdate?: () => void;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  content,
  onComplete,
  onUpdate,
}) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const baseDelay = 3; // Reduced from 5ms to 3ms for faster typing

  useEffect(() => {
    if (currentIndex < content.length) {
      const nextIndex = content.indexOf(">", currentIndex);
      const isTag = content[currentIndex] === "<";

      if (isTag && nextIndex !== -1) {
        // If we're at a tag, write the entire tag at once
        const tag = content.slice(currentIndex, nextIndex + 1);
        setDisplayedContent((prev) => prev + tag);
        setCurrentIndex(nextIndex + 1);
        onUpdate?.();
      } else if (content[currentIndex] === "\n") {
        // If we're at a newline, write it immediately
        setDisplayedContent((prev) => prev + "\n");
        setCurrentIndex((prev) => prev + 1);
        onUpdate?.();
      } else {
        // For regular characters, use the base delay
        const timeout = setTimeout(() => {
          setDisplayedContent((prev) => prev + content[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
          onUpdate?.();
        }, baseDelay);
        return () => clearTimeout(timeout);
      }
    } else if (onComplete) {
      onComplete();
    }
  }, [currentIndex, content, onComplete, onUpdate]);

  return (
    <div
      className="space-y-4"
      dangerouslySetInnerHTML={{
        __html: displayedContent
          .replace(/```html\n|\n```/g, "")
          .replace(/<div style="margin:10px"><\/div>/g, "")
          .replace(/<div style="margin:10px">/g, '<div class="mb-4">')
          .replace(/<strong>/g, '<strong class="font-semibold">')
          .replace(/<h3>/g, '<h3 class="text-lg font-semibold mb-2">')
          .replace(/<ul>/g, '<ul class="list-disc pl-6 space-y-2">')
          .replace(/<p>/g, '<p class="mb-2">'),
      }}
    />
  );
};

export default TypewriterEffect;
