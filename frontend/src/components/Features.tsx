import { useLanguage } from "@/hooks/use-language";

const Features = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: "🌱",
      title: t("naturalMedicine"),
      description: t("naturalMedicineDesc"),
    },
    {
      icon: "🧘‍♀️",
      title: t("holistic"),
      description: t("holisticDesc"),
    },
    {
      icon: "🤗",
      title: t("gentle"),
      description: t("gentleDesc"),
    },
  ];

  return (
    <section id="features" className="py-16 sm:py-20 bg-background scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">{t("featuresTitle")}</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">{t("featuresSubtitle")}</p>
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
        <div className="hidden md:grid md:grid-cols-3 gap-8">
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
