import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

const Hero = () => {
  const { t } = useLanguage();
  const heroTitle = t("heroTitle");

  return (
    <section className="min-h-[90vh] md:min-h-screen flex items-center justify-center hero-gradient pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
          {/* Text Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">
            {/* Título con mejor responsive */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 md:mb-6 leading-tight max-w-none lg:max-w-[600px] mx-auto lg:mx-0">
              {Array.isArray(heroTitle) ? heroTitle.join(" ") : heroTitle}
            </h1>

            {/* Subtítulo con ancho más flexible */}
            <div className="mb-6 md:mb-8">
              <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-muted-foreground leading-relaxed max-w-none lg:max-w-[500px] mx-auto lg:mx-0">
                {t("heroSubtitle")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center mb-8">
              <a href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gradient-button text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 md:py-4 cursor-pointer"
                >
                  {t("beginJourney")}
                </Button>
              </a>
              <a href="#how" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-3 md:py-4 glass-card border-primary/30 cursor-pointer"
                >
                  {t("learnMore")}
                </Button>
              </a>
            </div>
          </div>

          {/* Capybara Image */}
          <div className="flex justify-center lg:justify-end order-1 lg:order-2 mb-6 lg:mb-0">
            <div className="relative max-w-[180px] sm:max-w-[220px] md:max-w-[260px] lg:max-w-[300px] xl:max-w-[360px]">
              <picture>
                <source srcSet="/doctor_capybara.jpeg" type="image/jpeg" />
                <img
                  src="/doctor_capybara.jpeg"
                  alt="Doctor Capybara - Your gentle AI wellness companion in a natural setting"
                  className="w-full rounded-[20px] sm:rounded-[24px] md:rounded-[28px] shadow-2xl ring-1 ring-black/5 hover:scale-105 transition-transform duration-500"
                  decoding="async"
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width:1280px) 360px, (min-width:1024px) 300px, (min-width:768px) 260px, (min-width:640px) 220px, 180px"
                />
              </picture>
              <div className="absolute inset-0 rounded-[20px] sm:rounded-[24px] md:rounded-[28px] bg-gradient-to-t from-primary/10 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 sm:mt-12 md:mt-16 flex justify-center">
          <div className="glass-card p-3 sm:p-4 md:p-6 max-w-xs sm:max-w-sm md:max-w-md rounded-xl sm:rounded-2xl text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">{t("disclaimer")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
