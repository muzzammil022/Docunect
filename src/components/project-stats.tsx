import { HelpCircle } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  tooltip?: string
}

function StatCard({ label, value, tooltip }: StatCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground/60">{label}</span>
        {tooltip && (
          <button className="text-foreground/40 hover:text-foreground/60 transition-colors" title={tooltip}>
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
      </div>
      <p className="text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

export function ProjectStats() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 border border-border rounded-lg">
      <StatCard label="Compute" value="0.24 CU-hrs" />
      <StatCard label="Storage" value="0.03 GB" />
      <StatCard label="History" value="0.01 GB" />
      <StatCard label="Network transfer" value="0 GB" />
    </div>
  )
}
