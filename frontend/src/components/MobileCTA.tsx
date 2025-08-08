import { Button } from "@/components/ui/button";

const MobileCTA = () => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 md:hidden p-3 pt-2 bg-gradient-to-t from-background/95 to-background/60 backdrop-blur-md border-t">
      <a href="/dashboard">
        <Button className="w-full gradient-button py-6">Start Your Journey</Button>
      </a>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </div>
  );
};

export default MobileCTA;
