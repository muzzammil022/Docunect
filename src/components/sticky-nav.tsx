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

  const toggleTheme = () => {
    setIsDark(prev => !prev)
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 transition-all duration-300 bg-background/50 backdrop-blur-sm supports-[backdrop-filter]:bg-background/40">
      <div className="h-full container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 font-bold text-lg text-foreground">
          Docunect
        </Link>

        {/* Center Navigation */}
        <div className="flex-1 flex justify-center">
          <NavigationMenu>
            <NavigationMenuList>
              {navItems.map((item, idx) =>
                item.submenu ? (
                  <NavigationMenuItem key={idx}>
                    <NavigationMenuTrigger className="text-sm text-foreground">
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="w-40">
                      <div className="flex flex-col gap-1">
                        {item.submenu.map((subitem, sidx) => (
                          <NavigationMenuLink key={sidx} asChild>
                            <Link to={subitem.to} className="text-sm text-foreground hover:text-foreground/80">
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
                      <Link to={item.to} className="text-sm font-medium text-foreground hover:text-foreground/80">
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                )
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Right Actions */}
        <div className="flex-shrink-0 flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="size-5" />
            ) : (
              <Moon className="size-5" />
            )}
          </button>

          <Button asChild variant="ghost" size="sm">
            <Link to="/">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
