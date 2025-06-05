import type { FC } from "react";

interface CallToActionProps {
  currentLang: "es" | "en";
}

export const CallToAction: FC<CallToActionProps> = ({ currentLang }) => {
  return (
    <section className="bg-indigo-700 text-white py-12 sm:py-16 md:py-20 lg:py-24 rounded-b-lg shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">
            {currentLang === "es"
              ? "¿Listo para un Bienestar Natural?"
              : "Ready for Natural Well-being?"}
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            {currentLang === "es"
              ? "Únete a la comunidad de Doctor Capybara y transforma tu salud con el poder de la naturaleza."
              : "Join the Doctor Capybara community and transform your health with the power of nature."}
          </p>
          <form className="max-w-xl mx-auto flex flex-col sm:flex-row gap-4 mb-6 justify-center items-center">
            <input
              type="email"
              placeholder={
                currentLang === "es"
                  ? "Tu Dirección de Correo"
                  : "Your Email Address"
              }
              className="flex-grow h-12 sm:h-14 px-4 py-2 rounded-md text-gray-800 border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none bg-white transition-all duration-200 w-full sm:w-auto text-base"
              aria-label="Email Address"
            />
            <a
              href="#"
              target="_blank"
              className="h-12 sm:h-14 flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-700 font-bold px-6 rounded-md shadow-md transition duration-300 transform hover:scale-105 text-base w-full sm:w-auto min-w-[200px]"
              style={{ lineHeight: "1.2" }}
            >
              {currentLang === "es"
                ? "¡Regístrate y Obtén Consejos!"
                : "Sign Up & Get Tips!"}
            </a>
          </form>
          <p className="text-sm mt-2">
            {currentLang === "es"
              ? "O contáctanos directamente en "
              : "Or contact us directly at "}
            <a
              href="mailto:info@doctorcapybara.com"
              className="underline hover:text-emerald-200 transition duration-300"
            >
              info@doctorcapybara.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};
