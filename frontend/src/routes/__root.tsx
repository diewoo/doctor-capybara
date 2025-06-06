import { createRootRoute, Outlet, createRouter } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { dashboardLayoutRoute } from "./_dashboardLayout";
import { indexRoute } from "./index";
import { chatRoute } from "./_dashboardLayout/chat";

export const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardLayoutRoute.addChildren([chatRoute]),
]);
export const router = createRouter({ routeTree });

function NotFound() {
  return <div>Not Found</div>;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof rootRoute;
  }
}
