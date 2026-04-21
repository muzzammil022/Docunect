import { Search, Plus, MoreVertical } from 'lucide-react'
import React from 'react'
import { Button } from '@/src/components/ui/button'

interface Project {
  id: string
  name: string
  region: string
  createdAt: string
  storage: string
  computeLastActive: string
  branches: number
}

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Docunect',
    region: 'AWS US East 1 (N. Virginia)',
    createdAt: 'Apr 21, 2026 7:28 pm',
    storage: '29.95 MB',
    computeLastActive: 'Apr 21, 2026 10:04 pm',
    branches: 1,
  },
]

export function ProjectsTable() {
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredProjects = mockProjects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">{mockProjects.length} Project{mockProjects.length !== 1 ? 's' : ''}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline">
            New project
          </Button>
          <Button size="sm" variant="outline">
            Import data
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/40" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-foreground/40"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Name</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Region</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Created at</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Storage</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Compute last active at</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Branches</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70">Integrations</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-foreground/70"></th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((project) => (
              <tr key={project.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3 text-sm text-foreground font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">◊</div>
                    {project.name}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground/70">{project.region}</td>
                <td className="px-4 py-3 text-sm text-foreground/70">{project.createdAt}</td>
                <td className="px-4 py-3 text-sm text-foreground/70">{project.storage}</td>
                <td className="px-4 py-3 text-sm text-foreground/70">{project.computeLastActive}</td>
                <td className="px-4 py-3 text-sm text-foreground/70">{project.branches}</td>
                <td className="px-4 py-3 text-sm">
                  <Button size="sm" variant="ghost" className="gap-1 text-primary">
                    <Plus className="w-4 h-4" />
                    Add
                  </Button>
                </td>
                <td className="px-4 py-3 text-sm">
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/60">No projects found</p>
        </div>
      )}
    </div>
  )
}
