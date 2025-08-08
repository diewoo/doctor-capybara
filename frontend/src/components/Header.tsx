import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={
        "fixed top-0 left-0 right-0 z-50 glass-header transition-[box-shadow,background-color] duration-300 " +
        (scrolled ? "shadow-md" : "shadow-none")
      }
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold text-primary">Doctor Capybara</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-foreground hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how" className="text-foreground hover:text-primary transition-colors">
              How It Works
            </a>
            {/* <a href="#about" className="text-foreground hover:text-primary transition-colors">
              About
            </a> */}
          </nav>

          {/* CTA desktop */}
          <div className="hidden md:block">
            <a href="/dashboard">
              <Button size="sm" className="gradient-button cursor-pointer">
                Start Your Journey
              </Button>
            </a>
          </div>

          {/* Mobile menu button with shadcn sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <button
                aria-label="Open Menu"
                className="md:hidden p-2 rounded-md border border-border"
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 p-4">
                <a
                  href="#features"
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Features
                </a>
                <a href="#how" className="text-foreground hover:text-primary transition-colors">
                  How It Works
                </a>
                <a href="#about" className="text-foreground hover:text-primary transition-colors">
                  About
                </a>
                <a href="/dashboard">
                  <Button className="w-full gradient-button">Start Your Journey</Button>
                </a>
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Mobile dropdown no longer needed with Sheet */}
      </div>
    </header>
  );
};

export default Header;
