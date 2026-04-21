// src/routes/dashboard/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { DashboardSidebar } from '@/src/components/dashboard-sidebar'
import { useSidebar } from '@/src/components/sidebar-context'
import { cn } from '@/src/lib/utils'

export const Route = createFileRoute('/dashboard/')({
  component: DashboardComponent,
})

interface AnalysisFinding {
  id: string
  severity: 'error' | 'warning' | 'info'
  title: string
  description: string
  file?: string
  line?: number
  suggestion?: string
}

const mockFindings: AnalysisFinding[] = [
  {
    id: '1',
    severity: 'warning',
    title: 'Deprecated React API Usage',
    description: 'Using legacy Context API pattern. Consider using useContext hook for better performance.',
    file: 'src/components/auth.tsx',
    line: 45,
    suggestion: 'Refactor Context provider to use modern hooks pattern',
  },
  {
    id: '2',
    severity: 'error',
    title: 'Missing Error Boundary',
    description: 'No error boundary detected in main app component. This could cause entire app to crash on error.',
    file: 'src/routes/__root.tsx',
    line: 1,
    suggestion: 'Add Error Boundary component wrapper to root route',
  },
  {
    id: '3',
    severity: 'warning',
    title: 'Unused Dependencies',
    description: '3 packages in package.json are not imported anywhere in the code.',
    file: 'package.json',
    suggestion: 'Remove unused packages: lodash, moment, uuid',
  },
  {
    id: '4',
    severity: 'info',
    title: 'Type Safety Improvement',
    description: 'Function has implicit any types. Adding explicit types would improve IDE support.',
    file: 'src/lib/utils.ts',
    line: 12,
    suggestion: 'Add type annotations to function parameters and return type',
  },
]

function DashboardComponent() {
  const { isCollapsed } = useSidebar()
  
  const severityColors = {
    error: 'bg-red-500/10 text-red-700 border-red-200',
    warning: 'bg-yellow-500/10 text-yellow-700 border-yellow-200',
    info: 'bg-blue-500/10 text-blue-700 border-blue-200',
  }

  const severityBadgeColors = {
    error: 'bg-red-500/20 text-red-700',
    warning: 'bg-yellow-500/20 text-yellow-700',
    info: 'bg-blue-500/20 text-blue-700',
  }

  const severityCount = {
    error: mockFindings.filter(f => f.severity === 'error').length,
    warning: mockFindings.filter(f => f.severity === 'warning').length,
    info: mockFindings.filter(f => f.severity === 'info').length,
  }

  return (
    <div className="flex w-full min-h-screen">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main Content */}
      <div className={cn(
        'flex-1 pt-24 pb-20 transition-all duration-300',
        isCollapsed ? 'md:ml-20' : 'md:ml-56'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
              Code Analysis
            </h1>
            <p className="text-foreground/60">Personalized suggestions for improving your codebase</p>
          </div>

          {/* AI Summary Section */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-lg">✨</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  AI Analysis Summary
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Your codebase shows <span className="font-semibold text-red-600">2 critical issues</span> that require immediate attention, particularly around error handling and deprecated API usage. There are <span className="font-semibold text-yellow-600">2 warnings</span> related to performance optimization and dependency management. Overall, implementing the <span className="font-semibold text-blue-600">1 suggestion</span> for type safety would significantly improve code maintainability and IDE support. Estimated fix time: <span className="font-semibold">2-3 hours</span>.
                </p>
                <button className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Get detailed recommendations →
                </button>
              </div>
            </div>
          </div>

        {/* Findings Kanban Board */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
            Issues & Suggestions
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Errors Column */}
            <div className="bg-muted/20 border border-red-200/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-red-200/30">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <h3 className="font-semibold text-red-700" style={{ fontFamily: "var(--font-display)" }}>
                  Errors
                </h3>
                <span className="ml-auto text-xs font-bold text-red-600 bg-red-500/10 px-2 py-1 rounded">
                  {severityCount.error}
                </span>
              </div>
              <div className="space-y-3">
                {mockFindings.filter(f => f.severity === 'error').map((finding) => (
                  <div
                    key={finding.id}
                    className="bg-white border border-red-200/50 rounded-md p-3 hover:shadow-md transition-shadow cursor-move"
                  >
                    <h4 className="font-semibold text-sm text-foreground mb-1">{finding.title}</h4>
                    <p className="text-xs text-foreground/70 mb-2">{finding.description}</p>
                    {finding.file && (
                      <div className="text-xs font-mono text-foreground/50 mb-2">
                        {finding.file}{finding.line && `:${finding.line}`}
                      </div>
                    )}
                    {finding.suggestion && (
                      <div className="text-xs bg-red-50 border border-red-100 rounded p-2 text-red-700">
                        <span className="font-semibold">💡 </span>
                        {finding.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Warnings Column */}
            <div className="bg-muted/20 border border-yellow-200/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-yellow-200/30">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <h3 className="font-semibold text-yellow-700" style={{ fontFamily: "var(--font-display)" }}>
                  Warnings
                </h3>
                <span className="ml-auto text-xs font-bold text-yellow-600 bg-yellow-500/10 px-2 py-1 rounded">
                  {severityCount.warning}
                </span>
              </div>
              <div className="space-y-3">
                {mockFindings.filter(f => f.severity === 'warning').map((finding) => (
                  <div
                    key={finding.id}
                    className="bg-white border border-yellow-200/50 rounded-md p-3 hover:shadow-md transition-shadow cursor-move"
                  >
                    <h4 className="font-semibold text-sm text-foreground mb-1">{finding.title}</h4>
                    <p className="text-xs text-foreground/70 mb-2">{finding.description}</p>
                    {finding.file && (
                      <div className="text-xs font-mono text-foreground/50 mb-2">
                        {finding.file}{finding.line && `:${finding.line}`}
                      </div>
                    )}
                    {finding.suggestion && (
                      <div className="text-xs bg-yellow-50 border border-yellow-100 rounded p-2 text-yellow-700">
                        <span className="font-semibold">💡 </span>
                        {finding.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Info/Suggestions Column */}
            <div className="bg-muted/20 border border-blue-200/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-blue-200/30">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <h3 className="font-semibold text-blue-700" style={{ fontFamily: "var(--font-display)" }}>
                  Suggestions
                </h3>
                <span className="ml-auto text-xs font-bold text-blue-600 bg-blue-500/10 px-2 py-1 rounded">
                  {severityCount.info}
                </span>
              </div>
              <div className="space-y-3">
                {mockFindings.filter(f => f.severity === 'info').map((finding) => (
                  <div
                    key={finding.id}
                    className="bg-white border border-blue-200/50 rounded-md p-3 hover:shadow-md transition-shadow cursor-move"
                  >
                    <h4 className="font-semibold text-sm text-foreground mb-1">{finding.title}</h4>
                    <p className="text-xs text-foreground/70 mb-2">{finding.description}</p>
                    {finding.file && (
                      <div className="text-xs font-mono text-foreground/50 mb-2">
                        {finding.file}{finding.line && `:${finding.line}`}
                      </div>
                    )}
                    {finding.suggestion && (
                      <div className="text-xs bg-blue-50 border border-blue-100 rounded p-2 text-blue-700">
                        <span className="font-semibold">💡 </span>
                        {finding.suggestion}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

          {/* Tech Stack Summary */}
          <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground" style={{ fontFamily: "var(--font-display)" }}>
              Tech Stack
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground/70 mb-3">Runtime</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Node.js</span>
                    <span className="font-mono">v20.10.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">Framework</span>
                    <span className="font-mono">TanStack Start</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-foreground/70 mb-3">Key Dependencies</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">React</span>
                    <span className="font-mono">19.2.5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/60">TypeScript</span>
                    <span className="font-mono">5.6.3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}