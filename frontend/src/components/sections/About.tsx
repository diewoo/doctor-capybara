import type { FC } from "react";

interface AboutProps {
  currentLang: "es" | "en";
}

export const About: FC<AboutProps> = ({ currentLang }) => {
  return (
    <section id="about" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-indigo-700 rounded-md text-center">
            {currentLang === "es"
              ? "Conoce a Doctor Capybara"
              : "Meet Doctor Capybara"}
          </h2>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            <div className="w-full lg:w-1/2">
              <img
                src="/doctor_capybara.jpeg"
                alt="Doctor Capybara ofreciendo medicina orgánica"
                className="rounded-lg shadow-xl w-full h-auto object-cover"
              />
            </div>
            <div className="w-full lg:w-1/2 text-left space-y-4 sm:space-y-6">
              <p className="text-base sm:text-lg leading-relaxed rounded-md">
                {currentLang === "es"
                  ? "Doctor Capybara es un proyecto innovador que utiliza la inteligencia artificial, conectada a Gemini, para ofrecerte consejos de salud personalizados. Nuestro objetivo es empoderarte para que tomes el control de tu bienestar a través de soluciones naturales y accesibles."
                  : "Doctor Capybara is an innovative project using artificial intelligence, connected to Gemini, to offer personalized health advice. Our goal is to empower you to take control of your well-being through natural and accessible solutions."}
              </p>
              <p className="text-base sm:text-lg leading-relaxed rounded-md">
                {currentLang === "es"
                  ? "Nos enfocamos en la prevención y el tratamiento de enfermedades simples mediante el uso de alimentos y remedios orgánicos que la tierra nos ofrece. Creemos en un enfoque holístico y al alcance de todos."
                  : "We focus on preventing and treating simple ailments by utilizing food and organic remedies provided by the earth. We believe in a holistic and accessible approach for everyone."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
