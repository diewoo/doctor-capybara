import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/use-language";
import { type ChatExample } from "@/lib/i18n";

const ChatPreview = () => {
  const { t, tChat } = useLanguage();
  const [currentExample, setCurrentExample] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  const chatExamples: ChatExample[] = [
    tChat("chatExample1"),
    tChat("chatExample2"),
    tChat("chatExample3"),
  ];

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % chatExamples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [paused, chatExamples.length]);

  const currentChat = chatExamples[currentExample];

  return (
    <section id="chat" className="py-16 sm:py-20 hero-gradient scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t("chatTitle")}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("chatSubtitle")}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="glass-card p-4 sm:p-6 rounded-2xl space-y-4 min-h-[320px] transition-opacity duration-500">
            {/* User message */}
            <div className="flex justify-end animate-fade-in">
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3 max-w-xs">
                {currentChat.userMessage}
              </div>
            </div>

            {/* AI response */}
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/50 text-foreground rounded-2xl rounded-bl-md px-4 py-3 max-w-md">
                <p className="mb-2">{currentChat.aiResponse.text}</p>

                <p className="mb-2">
                  <strong>{currentChat.aiResponse.details}</strong>
                </p>
                <ul className="text-sm mb-2 pl-4">
                  {currentChat.aiResponse.list.map((item: string, index: number) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <p className="text-xs text-muted-foreground mt-2">{t("educationalOnly")}</p>
              </div>
            </div>

            {/* Typing indicator */}
            <div className="flex justify-start">
              <div className="bg-white/30 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress indicators (tap to select). Auto-rotate pausa brevemente al interactuar */}
        <div className="flex items-center justify-center mt-6 space-x-2">
          {chatExamples.map((_, index) => (
            <button
              key={index}
              aria-label={`Go to example ${index + 1}`}
              onClick={() => {
                setCurrentExample(index);
                setPaused(true);
                if (resumeTimeoutRef.current) window.clearTimeout(resumeTimeoutRef.current);
                // Reanudar auto-rotate después de 8s de inactividad
                resumeTimeoutRef.current = window.setTimeout(() => setPaused(false), 8000);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === currentExample ? "bg-primary" : "bg-primary/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChatPreview;
