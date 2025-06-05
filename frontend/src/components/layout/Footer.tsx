import type { FC } from "react";

interface FooterProps {
  currentLang: "es" | "en";
}

export const Footer: FC<FooterProps> = ({ currentLang }) => {
  return (
    <footer className="bg-gray-800 text-gray-300 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center space-y-4 md:space-y-0 md:flex-row md:justify-between">
          <p className="text-sm md:text-base">
            {currentLang === "es"
              ? "© 2025 Doctor Capybara. Todos los derechos reservados."
              : "© 2025 Doctor Capybara. All rights reserved."}
          </p>
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-6">
            <a
              href="#"
              className="text-sm md:text-base hover:text-white transition duration-300 rounded-md px-2 py-1"
            >
              {currentLang === "es"
                ? "Política de Privacidad"
                : "Privacy Policy"}
            </a>
            <a
              href="#"
              className="text-sm md:text-base hover:text-white transition duration-300 rounded-md px-2 py-1"
            >
              {currentLang === "es"
                ? "Términos de Servicio"
                : "Terms of Service"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
