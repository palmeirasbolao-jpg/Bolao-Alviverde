import { cn } from "@/lib/utils";

export function PalmeirasLogo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 100 100"
            className={cn("text-white", className)}
            fill="currentColor"
        >
            <circle cx="50" cy="50" r="48" fill="#006437" />
            <circle cx="50" cy="50" r="40" fill="white" />
            <path
                d="M50 15 a 35 35 0 0 1 0 70 a 35 35 0 0 1 0 -70"
                fill="#cf132c"
            />
            <circle cx="50" cy="50" r="28" fill="white" />
            <path d="M50,25 L50,35" stroke="#006437" strokeWidth="4" />
            <path d="M50,65 L50,75" stroke="#006437" strokeWidth="4" />
            <path d="M25,50 L35,50" stroke="#006437" strokeWidth="4" />
            <path d="M65,50 L75,50" stroke="#006437" strokeWidth="4" />
            <path d="M32,32 L40,40" stroke="#006437" strokeWidth="4" />
            <path d="M60,60 L68,68" stroke="#006437" strokeWidth="4" />
            <path d="M32,68 L40,60" stroke="#006437" strokeWidth="4" />
            <path d="M60,40 L68,32" stroke="#006437" strokeWidth="4" />
            <text
                x="50"
                y="55"
                textAnchor="middle"
                fontSize="24"
                fontWeight="bold"
                fill="#006437"
            >
                P
            </text>
        </svg>
    );
}
