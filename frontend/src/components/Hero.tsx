import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/use-language";

const Hero = () => {
  const { t } = useLanguage();
  const heroTitle = t("heroTitle");

  return (
    <section className="min-h-[90vh] md:min-h-screen flex items-center justify-center hero-gradient pt-20">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-6xl mx-auto">
          {/* Text Content */}
          <div className="text-center md:text-left order-2 md:order-1">
            {/* Título con mejor responsive */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight max-w-none md:max-w-[600px] mx-auto md:mx-0">
              {Array.isArray(heroTitle) ? heroTitle.join(" ") : heroTitle}
            </h1>

            {/* Subtítulo con ancho más flexible */}
            <div className="mb-6 md:mb-8">
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-none md:max-w-[500px] mx-auto md:mx-0">
                {t("heroSubtitle")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start items-center mb-8">
              <a href="/dashboard">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gradient-button text-base sm:text-lg px-6 sm:px-8 py-4 cursor-pointer"
                >
                  {t("beginJourney")}
                </Button>
              </a>
              <a href="#how">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 glass-card border-primary/30 cursor-pointer"
                >
                  {t("learnMore")}
                </Button>
              </a>
            </div>
          </div>

          {/* Capybara Image */}
          <div className="flex justify-center md:justify-end order-1 md:order-2 mb-8 md:mb-0">
            <div className="relative max-w-[200px] sm:max-w-[240px] md:max-w-[280px] lg:max-w-[320px] xl:max-w-[380px]">
              <picture>
                <source srcSet="/doctor_capybara.jpeg" type="image/jpeg" />
                <img
                  src="/doctor_capybara.jpeg"
                  alt="Doctor Capybara - Your gentle AI wellness companion in a natural setting"
                  className="w-full rounded-[28px] shadow-2xl ring-1 ring-black/5 hover:scale-105 transition-transform duration-500"
                  decoding="async"
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width:1280px) 380px, (min-width:1024px) 320px, (min-width:768px) 280px, (min-width:640px) 240px, 200px"
                />
              </picture>
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-t from-primary/10 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 md:mt-16 flex justify-center">
          <div className="glass-card p-4 md:p-6 max-w-sm md:max-w-md rounded-2xl text-center">
            <p className="text-sm text-muted-foreground">{t("disclaimer")}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
