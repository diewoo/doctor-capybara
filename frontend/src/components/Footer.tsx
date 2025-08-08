const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-10 sm:py-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-bold">Doctor Capybara</span>
          </div>

          <p className="text-background/80 mb-6 max-w-md mx-auto">
            Gentle AI guidance for your natural wellness journey. Honoring traditional wisdom with
            modern compassion.
          </p>

          <div className="flex justify-center space-x-8 mb-8 text-sm">
            <a href="#" className="text-background/80 hover:text-background transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-background/80 hover:text-background transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-background/80 hover:text-background transition-colors">
              Medical Disclaimer
            </a>
            <a href="#" className="text-background/80 hover:text-background transition-colors">
              Contact
            </a>
          </div>

          <div className="border-t border-background/20 pt-6">
            <p className="text-background/60 text-sm">
              © 2025 Doctor Capybara. All rights reserved. | Educational wellness guidance powered
              by AI
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
