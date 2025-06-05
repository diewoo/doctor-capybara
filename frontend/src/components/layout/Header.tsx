import type { FC } from "react";
import { useState } from "react";

interface HeaderProps {
  currentLang: "es" | "en";
  onToggleLanguage: () => void;
}

export const Header: FC<HeaderProps> = ({ currentLang, onToggleLanguage }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          <a
            href="#"
            className="text-xl md:text-2xl font-bold text-indigo-700 rounded-md"
          >
            Doctor Capybara
          </a>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <div className="relative w-6 h-6">
              <span
                className={`absolute block w-6 h-0.5 bg-gray-600 transform transition-all duration-300 ease-in-out ${
                  isMenuOpen ? "rotate-45 translate-y-2.5" : "-translate-y-1.5"
                }`}
              />
              <span
                className={`absolute block w-6 h-0.5 bg-gray-600 transform transition-all duration-300 ease-in-out ${
                  isMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute block w-6 h-0.5 bg-gray-600 transform transition-all duration-300 ease-in-out ${
                  isMenuOpen ? "-rotate-45 translate-y-2.5" : "translate-y-1.5"
                }`}
              />
            </div>
          </button>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <ul className="flex space-x-6">
              <li>
                <a
                  href="#about"
                  className="text-gray-600 hover:text-indigo-700 transition duration-300 rounded-md"
                >
                  {currentLang === "es" ? "Acerca de" : "About"}
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="text-gray-600 hover:text-indigo-700 transition duration-300 rounded-md"
                >
                  {currentLang === "es" ? "Beneficios" : "Benefits"}
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="text-gray-600 hover:text-indigo-700 transition duration-300 rounded-md"
                >
                  {currentLang === "es" ? "Contacto" : "Contact"}
                </a>
              </li>
            </ul>
            <button
              onClick={onToggleLanguage}
              className="bg-indigo-600 text-white hover:bg-indigo-700 font-bold py-2 px-4 rounded-md shadow-md transition duration-300"
            >
              {currentLang === "es" ? "English" : "Español"}
            </button>
          </nav>
        </div>

        {/* Mobile navigation */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="py-4">
            <ul className="flex flex-col space-y-4">
              <li>
                <a
                  href="#about"
                  className="block text-gray-600 hover:text-indigo-700 transition duration-300 rounded-md py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {currentLang === "es" ? "Acerca de" : "About"}
                </a>
              </li>
              <li>
                <a
                  href="#features"
                  className="block text-gray-600 hover:text-indigo-700 transition duration-300 rounded-md py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {currentLang === "es" ? "Beneficios" : "Benefits"}
                </a>
              </li>
              <li>
                <a
                  href="#contact"
                  className="block text-gray-600 hover:text-indigo-700 transition duration-300 rounded-md py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {currentLang === "es" ? "Contacto" : "Contact"}
                </a>
              </li>
              <li>
                <button
                  onClick={() => {
                    onToggleLanguage();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-bold py-2 px-4 rounded-md shadow-md transition duration-300"
                >
                  {currentLang === "es" ? "English" : "Español"}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};
