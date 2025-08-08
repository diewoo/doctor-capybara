import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="min-h-[90vh] md:min-h-screen flex items-center justify-center hero-gradient pt-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Text Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 leading-tight">
              Natural Healing, <span className="text-gradient">AI Powered</span>
            </h1>

            <p className="text-base sm:text-lg md:text-2xl text-muted-foreground mb-6 md:mb-8 leading-relaxed">
              Embark on your holistic wellness journey with gentle, AI-guided support that honors
              the wisdom of traditional healing and natural medicine.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center mb-8">
              <Button
                size="lg"
                className="w-full sm:w-auto gradient-button text-base sm:text-lg px-6 sm:px-8 py-4 cursor-pointer"
              >
                Begin Your Wellness Journey
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-4 glass-card border-primary/30 cursor-pointer"
              >
                Learn More
              </Button>
            </div>
          </div>

          {/* Capybara Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative max-w-[260px] sm:max-w-xs md:max-w-md lg:max-w-lg">
              <picture>
                <source srcSet="/doctor_capybara.jpeg" type="image/jpeg" />
                <img
                  src="/doctor_capybara.jpeg"
                  alt="Doctor Capybara - Your gentle AI wellness companion in a natural setting"
                  className="w-full rounded-[28px] shadow-2xl ring-1 ring-black/5 hover:scale-105 transition-transform duration-500"
                  decoding="async"
                  loading="eager"
                  fetchPriority="high"
                  sizes="(min-width:1024px) 480px, (min-width:768px) 380px, 240px"
                />
              </picture>
              <div className="absolute inset-0 rounded-[28px] bg-gradient-to-t from-primary/10 to-transparent"></div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-16 flex justify-center">
          <div className="glass-card p-6 max-w-md rounded-2xl text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Educational Information Only:</strong> This AI provides guidance for wellness
              exploration. Always consult healthcare providers for medical concerns.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
