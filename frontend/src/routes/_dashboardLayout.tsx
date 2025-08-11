import { createRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { rootRoute } from "./__root";
import { Heart, Menu } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";

export const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: LayoutComponent,
});

function LayoutComponent() {
  const { t } = useLanguage();

  return (
    <>
      <SidebarProvider>
        <div className="flex h-screen w-full flex-col md:flex-row overflow-hidden">
          <AppSidebar />
          <div className="flex flex-1 flex-col min-h-0">
            <div
              role="banner"
              className="flex h-14 md:h-16 shrink-0 items-center gap-3 border-b px-3 md:px-4 bg-gradient-to-r from-slate-50 to-white shadow-sm border border-slate-200"
            >
              {/* Botón de hamburguesa para mobile */}
              <MobileMenuButton />

              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                    Doctor Capybara
                  </h1>
                  <span className="text-xs md:text-sm text-slate-500">
                    {String(t("headerSubtitle"))}
                  </span>
                </div>
              </div>
            </div>
            <main className="flex-1 overflow-y-auto px-2 md:px-4">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}

// Componente para el botón de menú móvil
function MobileMenuButton() {
  const { isMobile, toggleSidebar } = useSidebar();

  if (!isMobile) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleSidebar}
      className="md:hidden p-2 h-10 w-10"
      aria-label="Abrir menú de navegación"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
