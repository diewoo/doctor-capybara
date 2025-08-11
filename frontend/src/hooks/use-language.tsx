import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { translations, type Language, type ChatExample, type HeroTitle } from "@/lib/i18n";

// Crear contexto para el idioma
interface LanguageContextType {
  language: Language;
  changeLanguage: (newLang: Language) => void;
  t: (key: keyof typeof translations.es) => string | HeroTitle;
  tChat: (key: "chatExample1" | "chatExample2" | "chatExample3") => ChatExample;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Proveedor del contexto
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("es");

  useEffect(() => {
    const saved = localStorage.getItem("doctor-capybara-language");
    if (saved && (saved === "es" || saved === "en")) {
      setLanguage(saved);
    }
  }, []);

  const changeLanguage = (newLang: Language) => {
    if (newLang === language) return;
    setLanguage(newLang);
    localStorage.setItem("doctor-capybara-language", newLang);
  };

  // Función para textos simples (string) o títulos (array)
  const t = (key: keyof typeof translations.es): string | HeroTitle => {
    const value = translations[language][key];
    if (typeof value === "string" || Array.isArray(value)) {
      return value;
    }
    // Si no es string ni array, devolver la clave como fallback
    return key as string;
  };

  // Función específica para ejemplos de chat
  const tChat = (key: "chatExample1" | "chatExample2" | "chatExample3"): ChatExample => {
    return translations[language][key] as ChatExample;
  };

  const value = { language, changeLanguage, t, tChat };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

// Hook para usar el contexto
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
