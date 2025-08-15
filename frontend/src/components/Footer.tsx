import { useLanguage } from "@/hooks/use-language";

const Footer = () => {
  const { t } = useLanguage();

  return (
        <footer className="bg-foreground text-background py-8 sm:py-10 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4 sm:mb-6">
            <span className="text-xl sm:text-2xl">🌿</span>
            <span className="text-lg sm:text-xl font-bold">Doctor Capybara</span>
          </div>

          <p className="text-background/80 mb-4 sm:mb-6 max-w-md mx-auto text-sm sm:text-base px-4">{t("footerDesc")}</p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8 text-xs sm:text-sm">
            <a href="#" className="text-background/80 hover:text-background transition-colors">
              {t("privacyPolicy")}
            </a>
            <a href="#" className="text-background/80 hover:text-background transition-colors">
              {t("termsOfService")}
            </a>
            <a href="#" className="text-background/80 hover:text-background transition-colors">
              {t("medicalDisclaimer")}
            </a>
            <a href="#" className="text-background/80 hover:text-background transition-colors">
              {t("contact")}
            </a>
          </div>

          <div className="border-t border-background/20 pt-4 sm:pt-6">
            <p className="text-background/60 text-xs sm:text-sm">{t("footerRights")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
