const Features = () => {
  const features = [
    {
      icon: "🌱",
      title: "Natural Medicine Focus",
      description:
        "Personalized recommendations rooted in herbal medicine, traditional healing practices, and time-tested natural remedies.",
    },
    {
      icon: "🧘‍♀️",
      title: "Holistic Approach",
      description:
        "Understand the mind-body-spirit connection with comprehensive wellness guidance that addresses your whole being.",
    },
    {
      icon: "🤗",
      title: "Gentle Guidance",
      description:
        "Compassionate AI support that listens without judgment and guides you with the gentle wisdom of a caring capybara.",
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20 bg-background scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Your Natural Wellness <span className="text-gradient">Companion</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover gentle, personalized guidance that honors traditional wisdom while embracing
            modern AI capabilities.
          </p>
        </div>

        {/* Mobile: horizontal carousel */}
        <div className="block md:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 snap-x snap-mandatory pr-4">
            {features.map((feature, index) => (
              <div key={index} className="feature-card text-center min-w-[80%] snap-center">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-2xl font-bold mb-4 text-primary">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="feature-card text-center">
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-2xl font-bold mb-4 text-primary">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
