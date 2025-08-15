import { useLanguage } from "@/hooks/use-language";

const Compliance = () => {
  const { t } = useLanguage();

  return (
    <section className="py-12 sm:py-16 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-primary">{t("complianceTitle")}</h2>

            <div className="space-y-3 sm:space-y-4 text-muted-foreground">
              <p className="text-base sm:text-lg">
                <strong className="text-foreground">{t("importantDisclaimer")}</strong>
              </p>

              <p className="text-sm sm:text-base">{t("complianceDesc")}</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl mb-2">🏥</div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">{t("fdaGuidelines")}</h3>
                  <p className="text-xs sm:text-sm">{t("fdaDesc")}</p>
                </div>

                <div className="text-center">
                  <div className="text-xl sm:text-2xl mb-2">🔬</div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">{t("evidenceBased")}</h3>
                  <p className="text-xs sm:text-sm">{t("evidenceDesc")}</p>
                </div>

                <div className="text-center sm:col-span-2 lg:col-span-1">
                  <div className="text-xl sm:text-2xl mb-2">🤝</div>
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">{t("complementaryCare")}</h3>
                  <p className="text-xs sm:text-sm">{t("complementaryDesc")}</p>
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
