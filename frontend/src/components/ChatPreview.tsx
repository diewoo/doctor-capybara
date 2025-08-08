import { useState, useEffect, useRef } from "react";

const ChatPreview = () => {
  const [currentExample, setCurrentExample] = useState(0);
  const [paused, setPaused] = useState(false);
  const resumeTimeoutRef = useRef<number | null>(null);

  const chatExamples = [
    {
      userMessage:
        "I've been feeling really stressed lately and having trouble sleeping. Any natural remedies you'd suggest?",
      aiResponse: {
        text: "I understand how challenging stress and sleep issues can be. Let me suggest some gentle, natural approaches:",
        details: "🌿 Herbal Support:",
        list: [
          "• Chamomile tea 30 minutes before bed",
          "• Passionflower for gentle relaxation",
          "• Lavender aromatherapy",
        ],
      },
    },
    {
      userMessage: "What are some natural ways to boost my energy levels throughout the day?",
      aiResponse: {
        text: "Great question! Here are some holistic approaches to naturally enhance your energy:",
        details: "⚡ Energy Boosters:",
        list: [
          "• Start with morning sunlight exposure",
          "• Try adaptogenic herbs like ashwagandha",
          "• Stay hydrated with herbal teas",
        ],
      },
    },
    {
      userMessage: "I'm looking for natural ways to support my digestive health. Any suggestions?",
      aiResponse: {
        text: "Digestive wellness is foundational to overall health! Here are some gentle approaches:",
        details: "🌱 Digestive Support:",
        list: [
          "• Ginger tea after meals",
          "• Probiotic-rich foods like kefir",
          "• Mindful eating practices",
        ],
      },
    },
  ];

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % chatExamples.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [paused]);

  const currentChat = chatExamples[currentExample];

  return (
    <section id="chat" className="py-16 sm:py-20 hero-gradient scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Experience Gentle <span className="text-gradient">AI Guidance</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how Doctor Capybara provides compassionate, personalized support for your wellness
            journey.
          </p>
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
                  {currentChat.aiResponse.list.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>

                <p className="text-xs text-muted-foreground mt-2">
                  Educational suggestions only. Consult your healthcare provider for persistent
                  issues.
                </p>
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
