// src/routes/__root.tsx
/// <reference types="vite/client" />
import appCss from "../styles/global.css?url";
import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  Outlet,
  createRootRoute,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { StickyNav } from "../components/sticky-nav";
import { Footer } from "../components/footer";
import { SidebarProvider } from "../components/sidebar-context";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  const router = useRouter();
  const isDashboard = router.state.location.pathname.startsWith("/dashboard");

  return (
    <RootDocument>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen">
          {/* Navbar */}
          <StickyNav />

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>

          {/* Footer - only on non-dashboard pages */}
          {!isDashboard && <Footer />}
        </div>
      </SidebarProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
