"use client";

import { useRef, useState } from "react";
import html2canvas from "html2canvas";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type ShareCardProps = {
    userName: string;
    avatarUrl: string;
    role: "MVP" | "RATA" | "TURN" | null;
    statsText: string;
};

export function ShareCard({ userName, avatarUrl, role, statsText }: ShareCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const getStyleForRole = () => {
        switch (role) {
            case "MVP":
                return "bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 text-zinc-900";
            case "RATA":
                return "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black text-red-500 border-2 border-red-600";
            case "TURN":
                return "bg-gradient-to-br from-mateco-primary to-green-600 text-white";
            default:
                return "bg-zinc-800 text-white";
        }
    };

    const getTitleForRole = () => {
        switch (role) {
            case "MVP":
                return "👑 CEBADOR LEGENDARIO";
            case "RATA":
                return "🚨 ALERTA DE RATA";
            case "TURN":
                return "🧉 HOY CEBA";
            default:
                return "MATE MATTERS";
        }
    };

    const handleShare = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);
        try {
            // Temporarily ensure card is visible for capture if it was hidden
            const canvas = await html2canvas(cardRef.current, {
                scale: 2, // High resolution
                useCORS: true,
                backgroundColor: null,
            });

            canvas.toBlob(async (blob) => {
                if (!blob) return;
                const file = new File([blob], `mateco-${role || "share"}.png`, { type: "image/png" });

                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    await navigator.share({
                        title: "MatecoApp",
                        text: "Mirá esto en MatecoApp!",
                        files: [file],
                    });
                } else {
                    // Fallback: download the image
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `mateco-${role || "share"}.png`;
                    a.click();
                    URL.revokeObjectURL(url);
                }
            });
        } catch (error) {
            console.error("Error generating share card:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4">
            {/* The invisible visual card that gets rendered to canvas */}
            <div className="relative w-full overflow-hidden rounded-xl">
                <div
                    ref={cardRef}
                    className={`relative aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-2xl p-8 shadow-2xl ${getStyleForRole()} flex flex-col justify-between`}
                >
                    {/* Noise overlay for texture */}
                    <div className="absolute inset-0 opacity-10 mix-blend-overlay" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')" }}></div>

                    <div className="relative z-10 text-center uppercase tracking-widest font-black text-xl opacity-80 mt-4">
                        {getTitleForRole()}
                    </div>

                    <div className="relative z-10 flex flex-col items-center gap-6 my-auto">
                        <div className={`rounded-full p-2 ${role === "RATA" ? "bg-red-500/20" : "bg-white/10"}`}>
                            <Avatar
                                name={userName}
                                src={avatarUrl}
                            /* Use a larger size theoretically, but we use native Avatar with classes */
                            />
                        </div>

                        <div className="text-center">
                            <h2 className="text-4xl font-black mb-2">{userName}</h2>
                            <p className={`text-lg font-medium opacity-90 p-4 rounded-xl ${role === 'RATA' ? 'bg-red-950/50' : 'bg-black/20'}`}>
                                {statsText}
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 text-center opacity-60 text-sm font-bold tracking-widest pb-4">
                        CREÁ TU RONDA EN MATECO.APP
                    </div>
                </div>
            </div>

            <Button
                onClick={handleShare}
                disabled={isGenerating}
                className="w-full bg-indigo-500 hover:bg-indigo-600 font-bold tracking-wide"
            >
                {isGenerating ? "Generando..." : "Compartir en IG / WhatsApp"}
            </Button>
        </div>
    );
}
