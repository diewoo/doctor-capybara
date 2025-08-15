import { useLanguage } from "@/hooks/use-language";

const HowItWorks = () => {
  const { t } = useLanguage();

  const steps = [
    {
      num: 1,
      title: t("step1"),
      desc: t("step1Desc"),
      icon: "📝",
    },
    {
      num: 2,
      title: t("step2"),
      desc: t("step2Desc"),
      icon: "🌿",
    },
    {
      num: 3,
      title: t("step3"),
      desc: t("step3Desc"),
      icon: "🤝",
    },
  ];

  return (
    <section id="how" className="py-12 sm:py-16 md:py-20 bg-background scroll-mt-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">{t("howTitle")}</h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2 sm:mt-3 max-w-2xl mx-auto px-4">{t("howSubtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
          {steps.map((s) => (
            <div key={s.num} className="glass-card rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="text-xl sm:text-2xl" aria-hidden>
                  {s.icon}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-primary">Step {s.num}</div>
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
