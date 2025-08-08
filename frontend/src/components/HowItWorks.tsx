const steps = [
  {
    num: 1,
    title: "Share your context",
    desc: "Tell us how you feel and any relevant history to personalize gentle guidance.",
    icon: "📝",
  },
  {
    num: 2,
    title: "Receive suggestions",
    desc: "Explore natural options rooted in traditional wisdom and evidence-based insights.",
    icon: "🌿",
  },
  {
    num: 3,
    title: "Reflect & act safely",
    desc: "Use the tips for education only and consult professionals for medical concerns.",
    icon: "🤝",
  },
];

const HowItWorks = () => {
  return (
    <section id="how" className="py-16 sm:py-20 bg-background scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">
            How <span className="text-gradient">It Works</span>
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
            Three gentle steps to start your wellness journey with Doctor Capybara.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((s) => (
            <div key={s.num} className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-2xl" aria-hidden>
                  {s.icon}
                </div>
                <div className="text-sm font-semibold text-primary">Step {s.num}</div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
