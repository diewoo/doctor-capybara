import { Link } from "@tanstack/react-router";
import type { FC } from "react";

interface HeroProps {
  currentLang: "es" | "en";
}

export const Hero: FC<HeroProps> = ({ currentLang }) => {
  return (
    <section className="bg-indigo-800 text-white py-12 sm:py-16 md:py-20 lg:py-32 rounded-b-lg shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-4 sm:mb-6 rounded-md">
            {currentLang === "es" ? (
              <>
                Doctor Capybara: <br className="hidden sm:inline" /> Tu Guía de
                Salud Natural con IA
              </>
            ) : (
              <>
                Doctor Capybara: <br className="hidden sm:inline" /> Your
                AI-Powered Natural Health Guide
              </>
            )}
          </h1>
          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 max-w-2xl mx-auto rounded-md">
            {currentLang === "es"
              ? "Descubre el poder de la naturaleza con Doctor Capybara, tu asistente inteligente que te sugiere remedios orgánicos basados en alimentos para prevenir y curar enfermedades simples."
              : "Discover the power of nature with Doctor Capybara, your intelligent assistant suggesting organic, food-based remedies to prevent and cure simple ailments."}
          </p>
          <Link
            to="/dashboard"
            className="inline-block bg-emerald-600 text-white hover:bg-emerald-700 font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-full shadow-lg transition duration-300 transform hover:scale-105 text-sm sm:text-base"
          >
            {currentLang === "es"
              ? "¡Empieza Tu Viaje de Salud!"
              : "Start Your Health Journey!"}
          </Link>
        </div>
      </div>
    </section>
  );
};
