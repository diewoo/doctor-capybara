const Compliance = () => {
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card p-6 sm:p-8 rounded-2xl text-center">
            <h2 className="text-3xl font-bold mb-6 text-primary">Your Health & Safety First</h2>

            <div className="space-y-4 text-muted-foreground">
              <p className="text-lg">
                <strong className="text-foreground">Important Disclaimer:</strong> This AI provides
                educational information only and is not a substitute for professional medical
                advice. Always consult healthcare providers for medical concerns.
              </p>

              <p>
                Our recommendations follow guidelines established by the US Food and Drug
                Administration (FDA), Centers for Disease Control and Prevention (CDC), and American
                Heart Association. Doctor Capybara complements but does not replace traditional
                healthcare.
              </p>

              <div className="grid md:grid-cols-3 gap-6 mt-8 pt-6 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl mb-2">🏥</div>
                  <h3 className="font-semibold text-foreground">FDA Guidelines</h3>
                  <p className="text-sm">Following established health standards</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl mb-2">🔬</div>
                  <h3 className="font-semibold text-foreground">Evidence-Based</h3>
                  <p className="text-sm">Rooted in traditional and modern research</p>
                </div>

                <div className="text-center">
                  <div className="text-2xl mb-2">🤝</div>
                  <h3 className="font-semibold text-foreground">Complementary Care</h3>
                  <p className="text-sm">Supporting your healthcare team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Compliance;
