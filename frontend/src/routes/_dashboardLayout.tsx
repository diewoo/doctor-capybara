import { createRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { rootRoute } from "./__root";
import { Heart } from "lucide-react";

export const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: LayoutComponent,
});

function LayoutComponent() {
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
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">
                    Doctor Capybara
                  </h1>
                  <span className="text-xs md:text-sm text-slate-500">
                    Tu asistente médico de confianza
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
