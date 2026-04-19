// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import HeroSection from '../components/hero-section-one'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return <HeroSection />
}