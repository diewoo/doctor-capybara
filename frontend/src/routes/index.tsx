import { createRoute } from "@tanstack/react-router";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ChatPreview from "@/components/ChatPreview";
import Compliance from "@/components/Compliance";
import Footer from "@/components/Footer";
import MobileCTA from "../components/MobileCTA";
import HowItWorks from "@/components/HowItWorks";
import "@/App.css";
import { rootRoute } from "./__root";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen pb-20 sm:pb-0">
      <Header />
      <Hero />
      <Features />
      <ChatPreview />
      <HowItWorks />
      <Compliance />
      <Footer />
      <MobileCTA />
    </div>
  );
}
