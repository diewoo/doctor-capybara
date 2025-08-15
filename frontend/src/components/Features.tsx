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
    <section id="features" className="py-12 sm:py-16 md:py-20 bg-background scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">{t("featuresTitle")}</h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">{t("featuresSubtitle")}</p>
        </div>

        {/* Mobile: horizontal carousel */}
        <div className="block lg:hidden overflow-x-auto scrollbar-hide -mx-4 px-4">
          <div className="flex gap-4 snap-x snap-mandatory pr-4">
            {features.map((feature, index) => (
              <div key={index} className="feature-card text-center min-w-[85%] sm:min-w-[80%] snap-center">
                <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">{feature.icon}</div>
                <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-primary">{feature.title}</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 xl:gap-8">
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
