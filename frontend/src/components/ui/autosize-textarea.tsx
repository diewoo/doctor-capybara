"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AutosizeTextAreaRef {
  textArea: HTMLTextAreaElement;
}

export interface AutosizeTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minHeight?: number;
  maxHeight?: number;
}

const AutosizeTextarea = React.forwardRef<
  AutosizeTextAreaRef,
  AutosizeTextareaProps
>(({ className, minHeight = 60, maxHeight = 200, ...props }, ref) => {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [textareaHeight, setTextareaHeight] = React.useState<number>(minHeight);

  React.useImperativeHandle(ref, () => ({
    textArea: textareaRef.current!,
  }));

  const adjustHeight = React.useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
    textarea.style.height = `${newHeight}px`;
    setTextareaHeight(newHeight);
  }, [minHeight, maxHeight]);

  React.useEffect(() => {
    adjustHeight();
  }, [adjustHeight, props.value]);

  return (
    <textarea
      ref={textareaRef}
      className={cn(
        "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{ height: textareaHeight }}
      {...props}
    />
  );
});

AutosizeTextarea.displayName = "AutosizeTextarea";

export { AutosizeTextarea };
