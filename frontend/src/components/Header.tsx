import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useLanguage } from "@/hooks/use-language";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { language, changeLanguage, t } = useLanguage();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed top-0 left-0 right-0 z-50 glass-header transition-[box-shadow,background-color] duration-300 " +
        (scrolled ? "shadow-md" : "shadow-none")
      }
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-xl sm:text-2xl">🌿</span>
            <span className="text-lg sm:text-xl font-bold text-primary">Doctor Capybara</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <a href="#features" className="text-foreground hover:text-primary transition-colors text-sm xl:text-base">
              {t("features")}
            </a>
            <a href="#how" className="text-foreground hover:text-primary transition-colors text-sm xl:text-base">
              {t("howItWorks")}
            </a>
          </nav>

          {/* Language selector and CTA desktop */}
          <div className="hidden lg:flex items-center space-x-3 xl:space-x-4">
            <div className="flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-white/20">
              <button
                onClick={() => changeLanguage("es")}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  language === "es"
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-700 hover:text-primary hover:bg-white/50"
                }`}
              >
                ES
              </button>
              <button
                onClick={() => changeLanguage("en")}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  language === "en"
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-700 hover:text-primary hover:bg-white/50"
                }`}
              >
                EN
              </button>
            </div>
            <a href="/dashboard">
              <Button size="sm" className="gradient-button cursor-pointer">
                {t("startJourney")}
              </Button>
            </a>
          </div>

          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </SheetTrigger>

            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <nav className="flex flex-col gap-4 p-4 sm:p-6">
                <a
                  href="#features"
                  className="text-foreground hover:text-primary transition-colors text-base sm:text-lg font-medium"
                >
                  {t("features")}
                </a>
                <a href="#how" className="text-foreground hover:text-primary transition-colors text-base sm:text-lg font-medium">
                  {t("howItWorks")}
                </a>

                {/* Language selector mobile */}
                <div className="flex items-center justify-center space-x-1 bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-lg border border-white/20">
                  <button
                    onClick={() => changeLanguage("es")}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      language === "es"
                        ? "bg-primary text-white shadow-md"
                        : "text-gray-700 hover:text-primary hover:bg-white/50"
                    }`}
                  >
                    ES
                  </button>
                  <button
                    onClick={() => changeLanguage("en")}
                    className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                      language === "en"
                        ? "bg-primary text-white shadow-md"
                        : "text-gray-700 hover:text-primary hover:bg-white/50"
                    }`}
                  >
                    EN
                  </button>
                </div>

                <a href="/dashboard">
                  <Button className="w-full gradient-button text-base sm:text-lg py-3">{t("startJourney")}</Button>
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
