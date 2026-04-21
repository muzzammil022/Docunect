import { useState } from 'react'
import TextType from './text-type'

const techStack = [
  { name: 'Next.js', logo: '/assets/tech-stack/Next.js.svg' },
  { name: 'React', logo: '/assets/tech-stack/Angular.svg' },
  { name: 'Bun', logo: '/assets/tech-stack/Bun.svg' },
  { name: 'MongoDB', logo: '/assets/tech-stack/MongoDB.svg' },
  { name: 'Redis', logo: '/assets/tech-stack/Redis.svg' },
  { name: 'Cloudflare', logo: '/assets/tech-stack/Cloudflare.svg' },
]

const techNames = techStack.map(tech => tech.name)

export function TypingTechStack() {
  const [currentTechIndex, setCurrentTechIndex] = useState(0)

  const handleSentenceComplete = (sentence: string) => {
    setCurrentTechIndex((prev) => (prev + 1) % techStack.length)
  }

  const currentTech = techStack[currentTechIndex]

  return (
    <span className="inline-flex items-center gap-2 align-middle">
      <img src={currentTech.logo} alt={currentTech.name} className="h-16 w-16" />
      <TextType
        text={techNames}
        typingSpeed={80}
        deletingSpeed={50}
        pauseDuration={2000}
        loop={true}
        showCursor={true}
        cursorCharacter="|"
        onSentenceComplete={handleSentenceComplete}
        className="text-foreground"
      />
    </span>
  )
}
