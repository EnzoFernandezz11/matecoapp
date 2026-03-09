"use client";

import html2canvas from "html2canvas";
import { useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { canvasToPngFile, shareWithFallback } from "@/lib/share/mobileShare";

type ShareCardProps = {
  userName: string;
  avatarUrl: string;
  role: "MVP" | "RATA" | "TURN" | null;
  statsText: string;
};

export function ShareCard({ userName, avatarUrl, role, statsText }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

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
        return "CEBADOR LEGENDARIO";
      case "RATA":
        return "ALERTA DE RATA";
      case "TURN":
        return "HOY CEBA";
      default:
        return "MATE MATTERS";
    }
  };

  const handleShare = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    setShareStatus(null);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });

      const file = await canvasToPngFile(canvas, `mateco-${role || "share"}.png`);
      const result = await shareWithFallback({
        title: "MatecoApp",
        text: "Mira esto en MatecoApp",
        url: typeof window !== "undefined" ? window.location.href : undefined,
        files: file ? [file] : undefined,
      });

      if (result === "copied") {
        setShareStatus("Link copiado. Pega y comparti.");
      }
      if (result === "whatsapp") {
        setShareStatus("Abriendo WhatsApp...");
      }
    } catch (error) {
      console.error("Error generating share card:", error);
      setShareStatus("No se pudo compartir la tarjeta.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-xl">
        <div
          ref={cardRef}
          className={`relative aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-2xl p-8 shadow-2xl ${getStyleForRole()} flex flex-col justify-between`}
        >
          <div
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')",
            }}
          />

          <div className="relative z-10 mt-4 text-center text-xl font-black uppercase tracking-widest opacity-80">
            {getTitleForRole()}
          </div>

          <div className="relative z-10 my-auto flex flex-col items-center gap-6">
            <div className={`rounded-full p-2 ${role === "RATA" ? "bg-red-500/20" : "bg-white/10"}`}>
              <Avatar name={userName} src={avatarUrl} className="h-24 w-24" />
            </div>

            <div className="text-center">
              <h2 className="mb-2 text-4xl font-black">{userName}</h2>
              <p
                className={`rounded-xl p-4 text-lg font-medium opacity-90 ${role === "RATA" ? "bg-red-950/50" : "bg-black/20"}`}
              >
                {statsText}
              </p>
            </div>
          </div>

          <div className="relative z-10 pb-4 text-center text-sm font-bold tracking-widest opacity-60">
            CREA TU RONDA EN MATECO.APP
          </div>
        </div>
      </div>

      <Button onClick={handleShare} disabled={isGenerating} className="w-full font-bold tracking-wide">
        {isGenerating ? "Generando..." : "Compartir"}
      </Button>
      {shareStatus ? <p className="text-xs text-zinc-600">{shareStatus}</p> : null}
    </div>
  );
}
