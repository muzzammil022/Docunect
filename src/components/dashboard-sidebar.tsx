import { Link } from '@tanstack/react-router'
import { FileText, GitBranch, Zap, Settings, HelpCircle, ChevronLeft, Plus, FolderOpen } from 'lucide-react'
import React from 'react'
import { cn } from '@/src/lib/utils'
import { useSidebar } from './sidebar-context'

const mainNavItems = [
  { icon: FileText, label: 'Analysis', href: '/dashboard' },
  { icon: GitBranch, label: 'Repositories', href: '#' },
  { icon: Zap, label: 'Suggestions', href: '#' },
]

const secondaryNavItems = [
  { icon: Settings, label: 'Settings', href: '#' },
]

export function DashboardSidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar()

  // Mock data
  const currentRepo = 'Docunect'
  const connectedRepos = 3

  return (
    <aside className={cn(
      'fixed left-0 top-16 bottom-0 bg-background border-r border-border transition-all duration-300 hidden md:flex flex-col',
      isCollapsed ? 'w-20' : 'w-56'
    )}>
      <div className="flex flex-col h-full">
        {/* Current Project */}
        <div className="p-4 border-b border-border/50">
          <div className={cn('flex items-center gap-3', isCollapsed && 'flex-col gap-2')}>
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
              <FolderOpen className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs text-foreground/60 uppercase tracking-wide">Current</p>
                <p className="font-medium text-sm text-foreground truncate" style={{ fontFamily: "var(--font-display)" }}>
                  {currentRepo}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className={isCollapsed ? 'space-y-2' : 'space-y-1'}>
            <p className={cn(
              'text-xs font-semibold text-foreground/50 px-2 py-2 uppercase tracking-wide',
              isCollapsed && 'text-center px-0'
            )}>
              {isCollapsed ? '' : 'Analysis'}
            </p>
            {mainNavItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    'text-foreground/70 hover:text-foreground hover:bg-muted/50',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}

            {/* Connected Repos */}
            <div className="pt-4 mt-4 border-t border-border/30">
              <div className="flex items-center justify-between px-2 mb-2">
                <p className={cn(
                  'text-xs font-semibold text-foreground/50 uppercase tracking-wide',
                  isCollapsed && 'hidden'
                )}>
                  Repositories
                </p>
                {!isCollapsed && (
                  <button className="text-foreground/50 hover:text-foreground transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className={cn('space-y-1', isCollapsed && 'space-y-2')}>
                <button className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  'text-foreground/70 hover:text-foreground hover:bg-muted/50',
                  isCollapsed && 'justify-center px-2'
                )}>
                  <GitBranch className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span className="text-xs">{connectedRepos} repo{connectedRepos !== 1 ? 's' : ''}</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Navigation */}
        <div className="p-3 border-t border-border/50 space-y-1">
          {secondaryNavItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  'text-foreground/70 hover:text-foreground hover:bg-muted/50',
                  isCollapsed && 'justify-center px-2'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
          <button className={cn(
            'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
            'text-foreground/70 hover:text-foreground hover:bg-muted/50',
            isCollapsed && 'justify-center px-2'
          )}>
            <HelpCircle className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Help</span>}
          </button>

          {/* Collapse Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              'text-foreground/70 hover:text-foreground hover:bg-muted/50',
              isCollapsed && 'justify-center px-2'
            )}
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronLeft className={cn('w-4 h-4 flex-shrink-0 transition-transform', isCollapsed && 'rotate-180')} />
            {!isCollapsed && <span>Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
