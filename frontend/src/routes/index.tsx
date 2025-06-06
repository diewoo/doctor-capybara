import { createRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { Hero } from "../components/sections/Hero";
import { About } from "../components/sections/About";
import { Features } from "../components/sections/Features";
import { Contact } from "../components/sections/Contact";
import { CallToAction } from "../components/sections/CallToAction";
import "../App.css";
import { rootRoute } from "./__root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Index,
});

function Index() {
  const [currentLang, setCurrentLang] = useState<"es" | "en">(
    (localStorage.getItem("doctorcapybara_lang") as "es" | "en") || "es"
  );

  useEffect(() => {
    document.documentElement.lang = currentLang;
    localStorage.setItem("doctorcapybara_lang", currentLang);
  }, [currentLang]);

  const toggleLanguage = () => {
    setCurrentLang((prev) => (prev === "es" ? "en" : "es"));
  };

  return (
    <div className="text-gray-800">
      <Header currentLang={currentLang} onToggleLanguage={toggleLanguage} />
      <Hero currentLang={currentLang} />
      <About currentLang={currentLang} />
      <Features currentLang={currentLang} />
      <CallToAction currentLang={currentLang} />
      <Contact currentLang={currentLang} />
      <Footer currentLang={currentLang} />
    </div>
  );
}
