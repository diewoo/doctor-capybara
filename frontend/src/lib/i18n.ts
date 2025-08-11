export interface ChatExample {
  userMessage: string;
  aiResponse: {
    text: string;
    details: string;
    list: string[];
  };
}

export type HeroTitle = string | string[];

export const translations = {
  es: {
    // Header
    features: "Características",
    howItWorks: "Cómo funciona",
    startJourney: "Iniciar consulta",

    // Hero
    heroTitle: ["Sanación Natural", "Con IA"],
    heroSubtitle:
      "Embárcate en tu viaje de bienestar holístico con apoyo suave y guiado por IA que honra la sabiduría de la sanación tradicional y la medicina natural.",
    beginJourney: "Iniciar consulta",
    learnMore: "Saber más",
    disclaimer:
      "Información solo educativa: Esta IA brinda orientación para tu bienestar. Ante dudas o síntomas importantes, consulta siempre a un profesional de salud.",

    // Features
    featuresTitle: "Tu Compañero de Bienestar Natural",
    featuresSubtitle:
      "Descubre orientación suave y personalizada que honra la sabiduría tradicional mientras abraza las capacidades modernas de IA.",
    naturalMedicine: "Enfoque en Medicina Natural",
    naturalMedicineDesc:
      "Recomendaciones personalizadas basadas en medicina herbal, prácticas de sanación tradicional y remedios naturales probados por el tiempo.",
    holistic: "Enfoque Holístico",
    holisticDesc:
      "Comprende la conexión mente-cuerpo-espíritu con orientación integral de bienestar que aborda todo tu ser.",
    gentle: "Orientación Suave",
    gentleDesc:
      "Apoyo compasivo de IA que escucha sin juzgar y te guía con la sabiduría gentil de un capibara cuidadoso.",

    // How It Works
    howTitle: "Cómo funciona",
    howSubtitle: "Tres pasos para iniciar tu consulta con el Doctor Capybara.",
    step1: "Comparte tu contexto",
    step1Desc:
      "Cuéntanos cómo te sientes y cualquier antecedente relevante para personalizar la orientación.",
    step2: "Recibe sugerencias",
    step2Desc: "Explora opciones naturales basadas en sabiduría tradicional y evidencia.",
    step3: "Reflexiona y actúa con seguridad",
    step3Desc:
      "Usa estos consejos con fines educativos y consulta a profesionales ante dudas o molestias importantes.",

    // Chat Preview
    chatTitle: "Experimenta Orientación IA Suave",
    chatSubtitle:
      "Ve cómo el Doctor Capybara brinda apoyo compasivo y personalizado para tu viaje de bienestar.",
    startChat: "Iniciar Chat",
    educationalOnly:
      "Sugerencias solo educativas. Consulta a tu proveedor de salud para problemas persistentes.",

    // Chat Examples
    chatExample1: {
      userMessage:
        "Últimamente me siento muy estresado y tengo problemas para dormir. ¿Algún remedio natural?",
      aiResponse: {
        text: "Entiendo lo desafiante que puede ser. Te comparto algunas opciones naturales y suaves:",
        details: "🌿 Apoyo con hierbas:",
        list: [
          "• Infusión de manzanilla 30 minutos antes de dormir",
          "• Pasiflora para relajación suave",
          "• Aromaterapia con lavanda",
        ],
      },
    } as ChatExample,
    chatExample2: {
      userMessage: "¿Formas naturales de aumentar mi energía durante el día?",
      aiResponse: {
        text: "Buena pregunta. Aquí algunas estrategias holísticas para potenciar tu energía:",
        details: "⚡ Impulso de energía:",
        list: [
          "• Exponte a luz solar por la mañana",
          "• Considera adaptógenos como ashwagandha",
          "• Hidrátate con infusiones",
        ],
      },
    } as ChatExample,
    chatExample3: {
      userMessage: "Busco apoyar mi digestión de forma natural. ¿Sugerencias?",
      aiResponse: {
        text: "La salud digestiva es base del bienestar. Algunas opciones suaves:",
        details: "🌱 Apoyo digestivo:",
        list: [
          "• Infusión de jengibre después de comer",
          "• Alimentos con probióticos como kéfir",
          "• Comer con atención y despacio",
        ],
      },
    } as ChatExample,

    // Compliance
    complianceTitle: "Tu Salud y Seguridad Primero",
    importantDisclaimer:
      "Descargo importante: Esta IA proporciona solo información educativa y no es un sustituto del consejo médico profesional. Siempre consulta a proveedores de atención médica para inquietudes médicas.",
    complianceDesc:
      "Nuestras recomendaciones siguen las pautas establecidas por la Administración de Alimentos y Medicamentos de EE. UU. (FDA), los Centros para el Control y la Prevención de Enfermedades (CDC) y la Asociación Estadounidense del Corazón. Doctor Capybara complementa pero no reemplaza la atención médica tradicional.",
    fdaGuidelines: "Pautas FDA",
    fdaDesc: "Siguiendo estándares de salud establecidos",
    evidenceBased: "Basado en Evidencia",
    evidenceDesc: "Fundado en investigación tradicional y moderna",
    complementaryCare: "Cuidado Complementario",
    complementaryDesc: "Apoyando a tu equipo de atención médica",

    // Footer
    footerDesc:
      "Orientación suave de IA para tu viaje de bienestar natural. Honrando la sabiduría tradicional con compasión moderna.",
    privacyPolicy: "Política de Privacidad",
    termsOfService: "Términos de Servicio",
    medicalDisclaimer: "Descargo Médico",
    contact: "Contacto",
    footerRights:
      "© 2025 Doctor Capybara. Todos los derechos reservados. | Orientación de bienestar educativo potenciada por IA",

    // Mobile CTA
    mobileCTA: "Iniciar consulta",
  },
  en: {
    // Header
    features: "Features",
    howItWorks: "How It Works",
    startJourney: "Start Your Journey",

    // Hero
    heroTitle: ["Natural Healing", "AI Powered"],
    heroSubtitle:
      "Embark on your holistic wellness journey with gentle, AI-guided support that honors the wisdom of traditional healing and natural medicine.",
    beginJourney: "Begin Your Wellness Journey",
    learnMore: "Learn More",
    disclaimer:
      "Educational Information Only: This AI provides guidance for wellness exploration. Always consult healthcare providers for medical concerns.",

    // Features
    featuresTitle: "Your Natural Wellness Companion",
    featuresSubtitle:
      "Discover gentle, personalized guidance that honors traditional wisdom while embracing modern AI capabilities.",
    naturalMedicine: "Natural Medicine Focus",
    naturalMedicineDesc:
      "Personalized recommendations rooted in herbal medicine, traditional healing practices, and time-tested natural remedies.",
    holistic: "Holistic Approach",
    holisticDesc:
      "Understand the mind-body-spirit connection with comprehensive wellness guidance that addresses your whole being.",
    gentle: "Gentle Guidance",
    gentleDesc:
      "Compassionate AI support that listens without judgment and guides you with the gentle wisdom of a caring capybara.",

    // How It Works
    howTitle: "How It Works",
    howSubtitle: "Three gentle steps to start your wellness journey with Doctor Capybara.",
    step1: "Share your context",
    step1Desc: "Tell us how you feel and any relevant history to personalize gentle guidance.",
    step2: "Receive suggestions",
    step2Desc: "Explore natural options rooted in traditional wisdom and evidence-based insights.",
    step3: "Reflect & act safely",
    step3Desc: "Use the tips for education only and consult professionals for medical concerns.",

    // Chat Preview
    chatTitle: "Experience Gentle AI Guidance",
    chatSubtitle:
      "See how Doctor Capybara provides compassionate, personalized support for your wellness journey.",
    startChat: "Start Chat",
    educationalOnly:
      "Educational suggestions only. Consult your healthcare provider for persistent issues.",

    // Chat Examples
    chatExample1: {
      userMessage:
        "I've been feeling really stressed lately and having trouble sleeping. Any natural remedies you'd suggest?",
      aiResponse: {
        text: "I understand how challenging stress and sleep issues can be. Let me suggest some gentle, natural approaches:",
        details: "🌿 Herbal Support:",
        list: [
          "• Chamomile tea 30 minutes before bed",
          "• Passionflower for gentle relaxation",
          "• Lavender aromatherapy",
        ],
      },
    } as ChatExample,
    chatExample2: {
      userMessage: "What are some natural ways to boost my energy levels throughout the day?",
      aiResponse: {
        text: "Great question! Here are some holistic approaches to naturally enhance your energy:",
        details: "⚡ Energy Boosters:",
        list: [
          "• Start with morning sunlight exposure",
          "• Try adaptogenic herbs like ashwagandha",
          "• Stay hydrated with herbal teas",
        ],
      },
    } as ChatExample,
    chatExample3: {
      userMessage: "I'm looking for natural ways to support my digestive health. Any suggestions?",
      aiResponse: {
        text: "Digestive wellness is foundational to overall health! Here are some gentle approaches:",
        details: "🌱 Digestive Support:",
        list: [
          "• Ginger tea after meals",
          "• Probiotic-rich foods like kefir",
          "• Mindful eating practices",
        ],
      },
    } as ChatExample,

    // Compliance
    complianceTitle: "Your Health & Safety First",
    importantDisclaimer:
      "Important Disclaimer: This AI provides educational information only and is not a substitute for professional medical advice. Always consult healthcare providers for medical concerns.",
    complianceDesc:
      "Our recommendations follow guidelines established by the US Food and Drug Administration (FDA), Centers for Disease Control and Prevention (CDC), and American Heart Association. Doctor Capybara complements but does not replace traditional healthcare.",
    fdaGuidelines: "FDA Guidelines",
    fdaDesc: "Following established health standards",
    evidenceBased: "Evidence-Based",
    evidenceDesc: "Rooted in traditional and modern research",
    complementaryCare: "Complementary Care",
    complementaryDesc: "Supporting your healthcare team",

    // Footer
    footerDesc:
      "Gentle AI guidance for your natural wellness journey. Honoring traditional wisdom with modern compassion.",
    privacyPolicy: "Privacy Policy",
    termsOfService: "Terms of Service",
    medicalDisclaimer: "Medical Disclaimer",
    contact: "Contact",
    footerRights:
      "© 2025 Doctor Capybara. All rights reserved. | Educational wellness guidance powered by AI",

    // Mobile CTA
    mobileCTA: "Start Your Journey",
  },
};

export type Language = "es" | "en";
export type TranslationKey = keyof typeof translations.es;
