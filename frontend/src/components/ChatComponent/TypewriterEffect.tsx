import React, { useEffect } from "react";

interface TypewriterEffectProps {
  content: string;
  onUpdate?: () => void;
  showTypingIndicator?: boolean;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({
  content,
  onUpdate,
  showTypingIndicator,
}) => {
  useEffect(() => {
    onUpdate?.();
  }, [content, onUpdate]);

  return (
    <div className="space-y-4">
      <div dangerouslySetInnerHTML={{ __html: content }} />
      {showTypingIndicator && (
        <span className="inline-block w-1.5 h-4 bg-blue-500/70 animate-pulse ml-1 rounded" />
      )}
    </div>
  );
};

export default TypewriterEffect;
