import { cn } from "@/lib/utils";

export function PalmeirasLogo({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            className={cn("text-white", className)}
            fill="currentColor"
            >
            <circle cx="100" cy="100" r="96" fill="#006437" />
            <circle cx="100" cy="100" r="88" fill="white" />
            <circle cx="100" cy="100" r="84" fill="#006437" />
            <g transform="translate(0, -5)">
                <path d="M100 32 L160 70 L160 130 L100 170 L40 130 L40 70 Z" fill="white" stroke="#ccc" strokeWidth="1"/>
                <path d="M100 35 L155 72 L155 128 L100 165 L45 128 L45 72 Z" fill="white" />

                <path d="M90,50 v25 l20,-10 v-25 l-20,10" fill="#EFEFEF"/>
                <path d="M90,50 v25 l-20,-10 v-25 l20,10" fill="#EFEFEF"/>

                <path d="M100,40 a 60 60 0 0 0 -35 10 l 35 -15 l 35 15 a 60 60 0 0 0 -35 -10" fill="#006437"/>


                <text x="100" y="105" fontSize="48" fill="#006437" textAnchor="middle" fontWeight="bold" fontFamily="serif">P</text>
                
                <g fill="white" stroke="white" strokeWidth="1">
                    <path d="M100 115 h-40 v3 h40z" />
                    <path d="M100 122 h-40 v3 h40z" />
                    <path d="M100 130 h-35 v3 h35z" />
                    <path d="M100 138 h-30 v3 h30z" />
                    <path d="M100 146 h-25 v3 h25z" />

                    <path d="M100 115 h40 v3 h-40z" />
                    <path d="M100 122 h40 v3 h-40z" />
                    <path d="M100 130 h35 v3 h-35z" />
                    <path d="M100 138 h30 v3 h-30z" />
                    <path d="M100 146 h25 v3 h-25z" />
                </g>
            </g>
            
            <text x="100" y="180" textAnchor="middle" fontSize="38" fontWeight="bold" fill="white" fontFamily="sans-serif" letterSpacing="-2">
                PALMEIRAS
            </text>

            <g fill="white">
                <polygon points="50,60 55,70 65,70 58,78 60,88 50,82 40,88 42,78 35,70 45,70" />
                <polygon points="35,100 40,110 50,110 43,118 45,128 35,122 25,128 27,118 20,110 30,110" />
                <polygon points="150,60 155,70 165,70 158,78 160,88 150,82 140,88 142,78 135,70 145,70" />
                <polygon points="165,100 170,110 180,110 173,118 175,128 165,122 155,128 157,118 150,110 160,110" />

                <g transform="translate(25, 25)">
                    <polygon points="50,60 55,70 65,70 58,78 60,88 50,82 40,88 42,78 35,70 45,70" />
                </g>
                <g transform="translate(-25, 25)">
                    <polygon points="150,60 155,70 165,70 158,78 160,88 150,82 140,88 142,78 135,70 145,70" />
                </g>
                <g transform="translate(20, 58)">
                    <polygon points="35,100 40,110 50,110 43,118 45,128 35,122 25,128 27,118 20,110 30,110" />
                </g>
                <g transform="translate(-20, 58)">
                    <polygon points="165,100 170,110 180,110 173,118 175,128 165,122 155,128 157,118 150,110 160,110" />
                </g>
            </g>
        </svg>
    );
}