"use client";
import React, { useRef, Dispatch, SetStateAction } from "react";
import { AutosizeTextarea, AutosizeTextAreaRef } from "../ui/autosize-textarea";
import { Button } from "../ui/button";
import { Lightbulb, Loader, SendIcon } from "lucide-react";
import PatientInsightSuggest from "./PatientInsightSuggest";

interface PropType {
  patientId: string;
  isDisabled: boolean;
  onSendMessage: (message: string) => void;
  input: string;
  setInput: Dispatch<SetStateAction<string>>;
}

const ChatInput = ({
  patientId,
  isDisabled,
  onSendMessage,
  input,
  setInput,
}: PropType) => {
  const textAreaRef = useRef<AutosizeTextAreaRef>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (input: string) => {
    if (!input.trim() || isDisabled) return;
    onSendMessage(input);
    setInput("");
    textAreaRef.current?.textArea.focus();
  };

  return (
    <div className="sticky bottom-0 w-full bg-white pb-6">
      <div className="flex flex-row gap-3 mx-2 md:mx-4 md:last:mb-6 py-3 lg:mx-auto lg:max-w-4xl xl:max-w-6xl">
        <div
          className="relative flex flex-col h-full
              flex-1 px-4 mb-0 lg:-mb-3 w-full"
        >
          {/* {Suggested prompt} */}
          <PatientInsightSuggest
            isDisabled={isDisabled}
            setInput={setInput}
            onSubmit={onSendMessage}
          />
          <div
            className="
            relative flex flex-col w-full border-gray-300
            border-[0.5px] shadow-md
            rounded-2xl p-3 !bg-[rgba(243,244,246,.3)]
            "
          >
            <AutosizeTextarea
              ref={textAreaRef}
              rows={3}
              minHeight={20}
              maxHeight={200}
              onChange={handleChange}
              value={input}
              disabled={isDisabled}
              onKeyUp={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  handleSubmit(input);
                  textAreaRef.current?.textArea.focus();
                }
              }}
              placeholder="Ask about the patient's condition"
              className="resize-none pr-12 !text-[15px]
              border-0 !bg-transparent
              !shadow-none !ring-0
              focus-visible:!ring-offset-0
              focus-visible:!ring-0"
            />

            <div
              className="flex w-full items-center 
            justify-between pt-3"
            >
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full font-normal
            !text-[13px] !bg-primary/5 
            !text-primary !border-primary"
                >
                  <Lightbulb />
                  Sugerencias
                </Button>
              </div>
              <Button
                disabled={!input.trim() || isDisabled}
                size="icon"
                className="right-[8px] !bg-black
              disabled:pointer-events-none !text-white
            disabled:!bg-gray-500"
                onClick={() => {
                  handleSubmit(input);
                  textAreaRef.current?.textArea.focus();
                }}
              >
                {isDisabled ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <SendIcon />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
