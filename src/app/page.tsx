import { ParallaxHero } from "@/components/ParallaxHero";
import { FeatureSections } from "@/components/FeatureSections";
import Link from "next/link";

export default function Landing() {
  return (
    <main className="relative">
      <Link
        href="/"
        className="fixed top-5 left-6 z-30 font-display text-xl tracking-tight text-star hover:text-moon transition-colors"
      >
        comet
      </Link>
      <ParallaxHero />
      <FeatureSections />
      <footer className="py-20 text-center text-cloud-deep text-sm">
        <Link href="/sign-in" className="text-star hover:text-moon transition-colors underline underline-offset-4">
          start reading →
        </Link>
        <div className="mt-6 font-mono text-xs">comet · built with curiosity</div>
      </footer>
    </main>
  );
}
