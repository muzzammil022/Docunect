import { Link, useRouter } from "@tanstack/react-router";
import { Button } from "@/src/components/ui/button";
import {
  Menu,
  X,
  MessageCircle,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";
import React, { useRef, useEffect } from "react";
import { cn } from "@/src/lib/utils";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/src/components/ui/navigation-menu";
import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient();

// GitHub mark — lucide-react v1 doesn't ship brand icons
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

// ── Nav items (unchanged from original) ───────────────────────────────────────
const navItems = [
  { name: "Features", to: "/" },
  {
    name: "Resources",
    submenu: [
      { name: "Blog", to: "/" },
      { name: "Community", to: "/" },
      { name: "Support", to: "/" },
    ],
  },
];

// ── User avatar dropdown — only rendered inside the dashboard header ──────────
function UserMenu({
  name,
  email,
  image,
}: {
  name: string;
  email: string;
  image?: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  async function handleSignOut() {
    await authClient.signOut();
    window.location.href = "/";
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/60 transition-colors"
        aria-haspopup="true"
        aria-expanded={open}
      >
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-border"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold ring-2 ring-border">
            {initials}
          </div>
        )}
        <span
          className="hidden sm:block text-sm font-medium text-foreground max-w-[120px] truncate"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {name}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-foreground/50 transition-transform hidden sm:block",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-background border border-border rounded-xl shadow-lg p-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="px-3 py-2.5 border-b border-border mb-1">
            <p
              className="text-sm font-semibold text-foreground truncate"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {name}
            </p>
            <p className="text-xs text-foreground/50 truncate">{email}</p>
          </div>

          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            Dashboard
          </Link>

          <Link
            to="/dashboard/repositories"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
          >
            Repositories
          </Link>

          <div className="border-t border-border my-1" />

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function StickyNav() {
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const router = useRouter();
  const isDashboard = router.state.location.pathname.startsWith("/dashboard");

  // Client-side session — zero server imports, safe in any bundle context.
  // isPending is true on first render; we wait for it before showing auth UI
  // in the dashboard header so there's no flash of wrong state.
  const { data: session, isPending } = authClient.useSession();
  const sessionUser = session?.user ?? null;

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Dashboard Navigation ────────────────────────────────────────────────────
  if (isDashboard) {
    return (
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-background border-b border-border">
        <div className="flex items-center justify-between h-16 px-6">
          {/* Left: Logo */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex-shrink-0 font-bold text-foreground text-lg hover:opacity-80 transition-opacity"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Docunect
            </Link>
          </div>

          {/* Right: Ask AI + Profile */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-sm rounded-md"
            >
              <MessageCircle className="size-4" />
              Ask AI
            </Button>

            {/* Show real user menu when signed in, plain icon linking to /login when not */}
            {!isPending && sessionUser ? (
              <UserMenu
                name={sessionUser.name}
                email={sessionUser.email}
                image={sessionUser.image}
              />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="rounded-md p-2"
                asChild
              >
                <Link to="/login">
                  <User className="size-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>
    );
  }

  // ── Regular / Marketing Navigation — EXACT ORIGINAL ────────────────────────
  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
          isScrolled
            ? "bg-background/60 backdrop-blur-md border-b border-border/40"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div
          className={`flex items-center justify-between transition-all duration-500 ${
            isScrolled ? "h-16 px-6 max-w-6xl mx-auto" : "h-20 px-4 container"
          }`}
        >
          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0 font-bold text-foreground text-lg hover:opacity-80 transition-opacity"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Docunect
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="md:hidden relative z-50 p-2 -mr-2"
          >
            <Menu
              className={cn(
                "size-6 transition-all duration-300",
                mobileMenuOpen && "scale-0 opacity-0",
              )}
            />
            <X
              className={cn(
                "size-6 absolute inset-0 m-auto transition-all duration-300",
                !mobileMenuOpen && "scale-0 opacity-0",
              )}
            />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-6">
            {/* Navigation */}
            <NavigationMenu viewport={false}>
              <NavigationMenuList className="gap-2">
                {navItems.map((item, idx) =>
                  item.submenu ? (
                    <NavigationMenuItem key={idx} className="relative">
                      <NavigationMenuTrigger
                        className="text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors duration-500 text-sm"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {item.name}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="w-40 md:right-0 md:left-auto border border-border/40 shadow-lg p-2 rounded-lg bg-background">
                        <div className="flex flex-col gap-1">
                          {item.submenu.map((subitem, sidx) => (
                            <NavigationMenuLink key={sidx} asChild>
                              <Link
                                to={subitem.to}
                                className="text-sm text-foreground hover:text-foreground/80 px-3 py-2"
                                style={{ fontFamily: "var(--font-display)" }}
                              >
                                {subitem.name}
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
                    <NavigationMenuItem key={idx}>
                      <NavigationMenuLink asChild>
                        <Link
                          to={item.to}
                          className="font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors duration-500 text-sm"
                          style={{ fontFamily: "var(--font-display)" }}
                        >
                          {item.name}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  ),
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Get Started CTA — original */}
            <Button
              asChild
              size="lg"
              className="rounded-lg transition-colors duration-500 text-sm flex-shrink-0"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <Link to="/">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel — original */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-30 md:hidden bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
          <nav className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[calc(100vh-64px)]">
            {navItems.map((item, idx) => (
              <div key={idx}>
                <div
                  className="text-foreground font-semibold px-4 py-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {item.name}
                </div>
                {item.submenu && (
                  <div className="flex flex-col gap-2 pl-4">
                    {item.submenu.map((subitem, sidx) => (
                      <Link
                        key={sidx}
                        to={subitem.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-sm text-foreground/70 hover:text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button asChild size="lg" className="rounded-lg mt-4 w-full">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                Book a Demo
              </Link>
            </Button>
          </nav>
        </div>
      )}
    </>
  );
}
