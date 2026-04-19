import { Button } from '@/components/ui/button'
import { ChevronRight, CirclePlay } from 'lucide-react'
import { Link } from '@tanstack/react-router'


export default function HeroSection() {
    return (
        <main className="overflow-hidden pt-16">
            <section className="bg-gradient-to-b to-muted from-background">
                <div className="relative py-20 md:py-32">
                    <div className="container mx-auto px-4">
                        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                            <div className="flex flex-col justify-center">
                                <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight mb-6">
                                    Simple payments for startups
                                </h1>
                                <p className="text-muted-foreground text-lg mb-8 max-w-xl">
                                    One tool that does it all. Search, generate, analyze, and chat—right inside your platform.
                                </p>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                                    <Button asChild size="lg" className="w-full sm:w-auto">
                                        <Link to="/">
                                            <span>Get Started</span>
                                            <ChevronRight className="ml-2 size-4" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                                        <Link to="/">
                                            <CirclePlay className="mr-2 size-4" />
                                            <span>Watch video</span>
                                        </Link>
                                    </Button>
                                </div>

                                <div className="mt-12">
                                    <p className="text-muted-foreground text-sm mb-4">Trusted by teams at:</p>
                                    <p className="text-foreground font-medium">Vercel, Spotify, Supabase</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-center md:col-span-1">
                                <div className="w-full perspective-near">
                                    <div className="before:border-foreground/5 before:bg-foreground/5 relative before:absolute before:-inset-x-4 before:bottom-7 before:top-0 before:skew-x-6 before:rounded-[calc(var(--radius)+1rem)] before:border">
                                        <div className="bg-background rounded-lg shadow-foreground/10 ring-foreground/5 relative skew-x-6 overflow-hidden border border-transparent shadow-md ring-1">
                                            <img
                                                src="/hero-img.jpg"
                                                alt="app screen"
                                                width="500"
                                                height="400"
                                                className="w-full h-auto object-cover"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}
