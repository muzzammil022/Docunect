import { ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'

export function Footer() {
  const [indiaTime, setIndiaTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
      const hours = istTime.getHours().toString().padStart(2, '0')
      const minutes = istTime.getMinutes().toString().padStart(2, '0')
      const seconds = istTime.getSeconds().toString().padStart(2, '0')
      setIndiaTime(`${hours}:${minutes}:${seconds}`)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <footer className="bg-background border-t border-border/40 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Time - Left on all sizes */}
          <p className="text-sm text-foreground/60" style={{ fontFamily: "var(--font-display)" }}>
            🌍 {indiaTime} IST
          </p>

          {/* Credit - Below on mobile, right on desktop */}
          <p className="text-sm text-foreground/60" style={{ fontFamily: "var(--font-display)" }}>
            This WebApp is created by{' '}
            <a
              href="https://muzzammilm.tech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-foreground hover:text-foreground/80 transition-colors duration-300 font-medium"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Muzzammil M
              <ExternalLink className="size-4" />
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
