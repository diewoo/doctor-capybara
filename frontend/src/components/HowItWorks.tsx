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
    <section id="how" className="py-16 sm:py-20 bg-background scroll-mt-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold">{t("howTitle")}</h2>
          <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">{t("howSubtitle")}</p>
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
