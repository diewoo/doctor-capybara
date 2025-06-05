import type { FC } from "react";

interface ContactProps {
  currentLang: "es" | "en";
}

export const Contact: FC<ContactProps> = ({ currentLang }) => {
  return (
    <section id="contact" className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 sm:mb-12 text-indigo-700 rounded-md text-center">
            {currentLang === "es" ? "Contáctanos" : "Contact Us"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12">
            <div className="bg-gray-50 p-6 sm:p-8 rounded-lg shadow-md">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-indigo-600">
                {currentLang === "es"
                  ? "Información de Contacto"
                  : "Contact Information"}
              </h3>
              <div className="space-y-4">
                <p className="flex items-center text-sm sm:text-base text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-indigo-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  info@doctorcapybara.com
                </p>
                <p className="flex items-center text-sm sm:text-base text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                    className="w-5 h-5 sm:w-6 sm:h-6 mr-3 text-indigo-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                  +1 (555) 123-4567
                </p>
              </div>
            </div>
            <div className="bg-gray-50 p-6 sm:p-8 rounded-lg shadow-md">
              <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-indigo-600">
                {currentLang === "es"
                  ? "Horario de Atención"
                  : "Business Hours"}
              </h3>
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-gray-600">
                  {currentLang === "es"
                    ? "Lunes - Viernes:"
                    : "Monday - Friday:"}{" "}
                  9:00 AM - 6:00 PM
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  {currentLang === "es" ? "Sábado:" : "Saturday:"} 10:00 AM -
                  4:00 PM
                </p>
                <p className="text-sm sm:text-base text-gray-600">
                  {currentLang === "es" ? "Domingo:" : "Sunday:"} Cerrado
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
