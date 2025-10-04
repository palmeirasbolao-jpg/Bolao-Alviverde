import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export function PalmeirasLogo({ className }: { className?: string }) {
    const palmeirasLogo = PlaceHolderImages.find(p => p.id === 'palmeiras-logo');

    if (!palmeirasLogo) return null;

    return (
        <Image
            alt={palmeirasLogo.description}
            src={palmeirasLogo.imageUrl}
            width={100}
            height={100}
            className={cn("text-white", className)}
        />
    );
}
