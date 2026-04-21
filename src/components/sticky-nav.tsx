import { Link } from '@tanstack/react-router'
import { Button } from '@/src/components/ui/button'
import { Menu, X } from 'lucide-react'
import React from 'react'
import { cn } from '@/src/lib/utils'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from '@/src/components/ui/navigation-menu'

const navItems = [
  { name: 'Features', to: '/' },
  {
    name: 'Resources',
    submenu: [
      { name: 'Blog', to: '/' },
      { name: 'Community', to: '/' },
      { name: 'Support', to: '/' },
    ],
  },
]

export function StickyNav() {
  const [isScrolled, setIsScrolled] = React.useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
        isScrolled ? 'bg-background/60 backdrop-blur-md border-b border-border/40' : 'bg-transparent border-b border-transparent'
      }`}>
        <div className={`flex items-center justify-between transition-all duration-500 ${
          isScrolled ? 'px-6 py-2 h-16 max-w-6xl mx-auto' : 'px-4 py-4 container'
        }`}>
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 font-bold text-foreground text-lg hover:opacity-80 transition-opacity" style={{ fontFamily: "var(--font-display)" }}>
            Docunect
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="md:hidden relative z-50 p-2 -mr-2">
            <Menu className={cn('size-6 transition-all duration-300', mobileMenuOpen && 'scale-0 opacity-0')} />
            <X className={cn('size-6 absolute inset-0 m-auto transition-all duration-300', !mobileMenuOpen && 'scale-0 opacity-0')} />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 items-center justify-end gap-6">
            {/* Navigation */}
            <NavigationMenu viewport={false}>
              <NavigationMenuList className="gap-2">
                {navItems.map((item, idx) =>
                  item.submenu ? (
                    <NavigationMenuItem key={idx} className="relative">
                      <NavigationMenuTrigger className="text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors duration-500 text-sm" style={{ fontFamily: "var(--font-display)" }}>
                        {item.name}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="w-40 md:right-0 md:left-auto border border-border/40 shadow-lg p-2 rounded-lg bg-background">
                        <div className="flex flex-col gap-1">
                          {item.submenu.map((subitem, sidx) => (
                            <NavigationMenuLink key={sidx} asChild>
                              <Link to={subitem.to} className="text-sm text-foreground hover:text-foreground/80 px-3 py-2" style={{ fontFamily: "var(--font-display)" }}>
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
                        <Link to={item.to} className="font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors duration-500 text-sm" style={{ fontFamily: "var(--font-display)" }}>
                          {item.name}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  )
                )}
              </NavigationMenuList>
            </NavigationMenu>

            {/* Get Started CTA */}
            <Button asChild size="lg" className="rounded-lg transition-colors duration-500 text-sm flex-shrink-0" style={{ fontFamily: "var(--font-display)" }}>
              <Link to="/">Sign Up</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Panel */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-30 md:hidden bg-background/95 backdrop-blur-sm animate-in fade-in duration-300">
          <nav className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[calc(100vh-64px)]">
            {navItems.map((item, idx) => (
              <div key={idx}>
                <div className="text-foreground font-semibold px-4 py-2" style={{ fontFamily: "var(--font-display)" }}>
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
                        style={{ fontFamily: "var(--font-display)" }}>
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <Button asChild size="lg" className="rounded-lg mt-4 w-full">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>Book a Demo</Link>
            </Button>
          </nav>
        </div>
      )}
    </>
  )
}
