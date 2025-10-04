import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Logo } from "@/components/icons/logo";

export default function LandingPage() {
  const heroImage = PlaceHolderImages.find(p => p.id === 'stadium-background');

  return (
    <div className="relative flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="relative h-screen w-full">
          {heroImage && (
            <Image
              alt={heroImage.description}
              className="object-cover"
              data-ai-hint={heroImage.imageHint}
              fill
              src={heroImage.imageUrl}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="relative flex h-full flex-col items-center justify-center text-center text-primary-foreground">
            <Logo />
            <h1 className="font-headline text-5xl font-bold tracking-tighter md:text-7xl mt-4">
              Bolão Alviverde
            </h1>
            <p className="mx-auto mt-4 max-w-[700px] font-body text-lg text-gray-200 md:text-xl">
              Mostre que você entende de Palmeiras. Dê seus palpites, some pontos e seja o campeão do bolão!
            </p>
            <div className="mt-8 flex gap-4">
              <Button asChild size="lg" className="font-bold">
                <Link href="/login">Entrar</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="font-bold">
                <Link href="/register">Cadastrar</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
