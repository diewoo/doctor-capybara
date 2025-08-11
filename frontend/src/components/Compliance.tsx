import { useLanguage } from "@/hooks/use-language";

const Compliance = () => {
  const { t } = useLanguage();

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-6 sm:p-8 rounded-2xl text-center">
            <h2 className="text-3xl font-bold mb-6 text-primary">{t("complianceTitle")}</h2>

            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg">
                <strong className="text-foreground">{t("importantDisclaimer")}</strong>
              </p>

              <p>{t("complianceDesc")}</p>

              <div className="grid md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏥</div>
                  <h3 className="font-semibold text-foreground">{t("fdaGuidelines")}</h3>
                  <p className="text-sm">{t("fdaDesc")}</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl mb-2">🔬</div>
                  <h3 className="font-semibold text-foreground">{t("evidenceBased")}</h3>
                  <p className="text-sm">{t("evidenceDesc")}</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl mb-2">🤝</div>
                  <h3 className="font-semibold text-foreground">{t("complementaryCare")}</h3>
                  <p className="text-sm">{t("complementaryDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Compliance;
