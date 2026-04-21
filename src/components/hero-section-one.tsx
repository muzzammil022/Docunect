import { Button } from '@/components/ui/button'
import { ChevronRight, CirclePlay } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { TypingTechStack } from './typing-tech-stack'


export default function HeroSection() {
    const containerRef = useRef(null)

    useEffect(() => {
        // Load Lottie web player and animate
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js'
        script.onload = () => {
            const lottie = (window as any).lottie
            if (lottie && containerRef.current) {
                fetch('/Data _ Bundling.json')
                    .then(res => res.json())
                    .then(data => {
                        lottie.loadAnimation({
                            container: containerRef.current,
                            renderer: 'svg',
                            loop: true,
                            autoplay: true,
                            animationData: data,
                        })
                    })
            }
        }
        document.body.appendChild(script)

        return () => {
            document.body.removeChild(script)
        }
    }, [])

    return (
        <main className="overflow-hidden">
            <section className="bg-gradient-to-b to-muted from-background">
                <div className="relative pt-20 pb-20 md:py-32">
                    <div className="container">
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="flex flex-col justify-center">
                                <h1 className="title mb-6">
                                    You don't read the docs. We do. <TypingTechStack />
                                </h1>
                                <p className="subtitle mb-8 max-w-xl">
                                    Connect your repo, we'll handle the boring part - changelogs, updates, breaking changes, all in one place.
                                </p>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <Button asChild size="lg" className="w-full sm:w-auto">
                                        <Link to="/">
                                            <span>Get Started</span>
                                            <ChevronRight className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center justify-center md:col-span-1">
                                <div ref={containerRef} className="w-full max-w-lg" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
