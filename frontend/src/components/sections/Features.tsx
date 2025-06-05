import type { FC } from "react";

interface FeaturesProps {
  currentLang: "es" | "en";
}

export const Features: FC<FeaturesProps> = ({ currentLang }) => {
  const features = [
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-10 h-10 sm:w-12 sm:h-12 mx-auto"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9.75 9.75m0 0l-1.35 1.35M9.75 9.75l3.034-3.034M3.75 6.011l1.278-.426A4.5 4.5 0 0112 4.5c2.757 0 5.226 1.17 6.912 3.011L21.75 6m0 0v2.25m0 0l-2.25 2.25M12 12.75l-3 3m0 0l-3 3M12 12.75l3 3m0 0l3 3M12 12.75.904 15.904M12 12.75a2.25 2.25 0 002.25 2.25M12 12.75a2.25 2.25 0 012.25 2.25m-4.5 0A2.25 2.25 0 0012 15h3.75m-3.75 0a2.25 2.25 0 01-2.25-2.25m-4.5 0H3.75m0 0a2.25 2.25 0 01-2.25-2.25V6.75m18 0h.008v.008H21.75m-19.5 0h.008v.008H1.5m2.25 0v2.25m18-9v2.25m-18 0a2.25 2.25 0 002.25 2.25h1.372c.516 0 .966.394 1.017.945L18.25 15m-6.375-1.125L13.5 14.25m3.625-1.125L17.25 14.25M21.75 12a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V8.25a.75.75 0 01.75-.75h5.25c.414 0 .75.336.75.75v3.75z"
          />
        </svg>
      ),
      title:
        currentLang === "es"
          ? "Inteligencia Artificial"
          : "Artificial Intelligence",
      description:
        currentLang === "es"
          ? "Consejos de salud personalizados impulsados por Gemini para tus necesidades."
          : "Personalized health advice powered by Gemini for your needs.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-10 h-10 sm:w-12 sm:h-12 mx-auto"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.118 15.606a2.25 2.25 0 010-3.182l2.99-2.99a2.25 2.25 0 000-3.182l-2.99-2.99a2.25 2.25 0 010-3.182m9.764 6.364a2.25 2.25 0 000-3.182l-2.99-2.99a2.25 2.25 0 010-3.182l2.99-2.99a2.25 2.25 0 000-3.182m-3.536 6.364a2.25 2.25 0 010-3.182l-2.99-2.99a2.25 2.25 0 000-3.182l2.99-2.99a2.25 2.25 0 010-3.182"
          />
        </svg>
      ),
      title: currentLang === "es" ? "Remedios Naturales" : "Natural Remedies",
      description:
        currentLang === "es"
          ? "Sugerencias de curas basadas en alimentos orgánicos y de la tierra."
          : "Suggestions for cures based on organic, earth-grown foods.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-10 h-10 sm:w-12 sm:h-12 mx-auto"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.672.825 9.38 9.38 0 002.672-.825M12 21.75V4.75m0 17v-4.5m0 4.5a3 3 0 01-3-3m3 3a3 3 0 003-3m-3 3h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zM12 4.75a3 3 0 00-3-3H6.75a.75.75 0 00-.75.75v16.5c0 .414.336.75.75.75H9a3 3 0 003-3V4.75zm0 0a3 3 0 013-3h2.25a.75.75 0 01.75.75v16.5c0 .414-.336.75-.75.75H15a3 3 0 01-3-3V4.75z"
          />
        </svg>
      ),
      title:
        currentLang === "es"
          ? "Accesible y Asequible"
          : "Accessible & Affordable",
      description:
        currentLang === "es"
          ? "Consultas al alcance de todos los bolsillos, para tu bienestar."
          : "Consultations within everyone's reach, for your well-being.",
    },
    {
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
          className="w-10 h-10 sm:w-12 sm:h-12 mx-auto"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21H10.5m-6.75 0L7.5 15m-6.75 0h.008v.008H1.5zm0 0h.008v.008H1.5zM12 21.75V4.75m0 17v-4.5m0 4.5a3 3 0 01-3-3m3 3a3 3 0 003-3m-3 3h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zm0 0h-.008v-.008H12zM12 4.75a3 3 0 00-3-3H6.75a.75.75 0 00-.75.75v16.5c0 .414.336.75.75.75H9a3 3 0 003-3V4.75zm0 0a3 3 0 013-3h2.25a.75.75 0 01.75.75v16.5c0 .414-.336.75-.75.75H15a3 3 0 01-3-3V4.75z"
          />
        </svg>
      ),
      title:
        currentLang === "es" ? "Seguridad y Privacidad" : "Security & Privacy",
      description:
        currentLang === "es"
          ? "Cumplimos con SOC2 e HIPAA para proteger tu información."
          : "We comply with SOC2 and HIPAA to protect your information.",
    },
  ];

  return (
    <section
      id="features"
      className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gray-50"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-indigo-700 rounded-md text-center">
            {currentLang === "es" ? "Beneficios Clave" : "Key Benefits"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white p-6 sm:p-8 rounded-lg shadow-md hover:shadow-xl transition duration-300 transform hover:-translate-y-1"
              >
                <div className="text-4xl sm:text-5xl text-emerald-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 rounded-md">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600 rounded-md">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
