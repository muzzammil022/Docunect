import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import React from 'react'
import { Moon, Sun } from 'lucide-react'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from '@/components/ui/navigation-menu'

const navItems = [
  { name: 'Features', to: '/' },
  { name: 'Pricing', to: '/' },
  { name: 'Docs', to: '/' },
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
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window === 'undefined') return false
    
    // Check localStorage first
    const saved = localStorage.getItem('theme')
    if (saved) {
      return saved === 'dark'
    }
    
    // Fall back to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    // Apply theme on mount and when isDark changes
    const html = document.documentElement
    if (isDark) {
      html.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      html.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDark])

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-500 ${
      isScrolled ? 'bg-background/60 backdrop-blur-md border-b border-border/40' : 'bg-transparent border-b border-transparent'
    }`}>
      <div className={`h-16 flex items-center justify-between transition-all duration-500 ${
        isScrolled ? 'px-6 py-2 max-w-6xl mx-auto' : 'px-4 py-4 container'
      }`}>
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 font-bold text-foreground text-lg hover:opacity-80 transition-opacity" style={{ fontFamily: "'Vert Grotesk Display', sans-serif" }}>
          Docunect
        </Link>

        {/* Right Section: Navigation + CTA */}
        <div className="flex-1 flex items-center justify-end gap-6">
          {/* Navigation */}
          <NavigationMenu>
            <NavigationMenuList className="gap-2">
              {navItems.map((item, idx) =>
                item.submenu ? (
                  <NavigationMenuItem key={idx}>
                    <NavigationMenuTrigger className="text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors duration-500 text-sm" style={{ fontFamily: "'Vert Grotesk Display', sans-serif" }}>
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="w-40">
                      <div className="flex flex-col gap-1">
                        {item.submenu.map((subitem, sidx) => (
                          <NavigationMenuLink key={sidx} asChild>
                            <Link to={subitem.to} className="text-sm text-foreground hover:text-foreground/80 px-3 py-2" style={{ fontFamily: "'Vert Grotesk Display', sans-serif" }}>
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
                      <Link to={item.to} className="font-medium text-foreground px-4 py-2 rounded-lg hover:bg-muted transition-colors duration-500 text-sm" style={{ fontFamily: "'Vert Grotesk Display', sans-serif" }}>
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              )}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Get Started CTA */}
          <Button asChild size="lg" className="rounded-lg transition-colors duration-500 text-sm flex-shrink-0" style={{ fontFamily: "'Vert Grotesk Display', sans-serif" }}>
            <Link to="/">Book a Demo</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
