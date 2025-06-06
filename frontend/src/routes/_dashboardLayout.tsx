import { createRoute, Outlet } from "@tanstack/react-router";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { rootRoute } from "./__root";

export const dashboardLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden w-full">
          <AppSidebar />
          <div className="flex flex-1 flex-col">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <h1 className="text-2xl font-bold"></h1>
            </header>
            <main className="flex flex-1 flex-col overflow-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
}
