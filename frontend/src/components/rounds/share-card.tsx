"use client";

import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type ShareCardProps = {
  userName: string;
  avatarUrl: string;
  role: "MVP" | "RATA" | "TURN" | null;
  statsText: string;
};

function getStyleForRole(role: ShareCardProps["role"]) {
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
}

function getTitleForRole(role: ShareCardProps["role"]) {
  switch (role) {
    case "MVP":
      return "CEBADOR LEGENDARIO";
    case "RATA":
      return "ALERTA DE RATA";
    case "TURN":
      return "HOY CEBA";
    default:
      return "MATECO APP";
  }
}

async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("No se pudo generar la imagen"));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

async function safeCopyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue with legacy fallback below.
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand("copy");
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

export function ShareCard({ userName, avatarUrl, role, statsText }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
    };
  }, [downloadUrl]);

  const shareText = `Mira esta tarjeta de MatecoApp: ${userName}`;
  const shareUrl = "https://mateco.app";

  const buildCardImage = async () => {
    if (!cardRef.current) {
      throw new Error("No se encontro la tarjeta para compartir");
    }
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: null,
    });
    return canvasToBlob(canvas);
  };

  const handleShare = async () => {
    setIsGenerating(true);
    setStatus(null);
    try {
      const blob = await buildCardImage();
      const file = new File([blob], `mateco-${role || "share"}.png`, { type: "image/png" });

      // Prefer native share sheet with image file on mobile.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: "MatecoApp",
          text: shareText,
          files: [file],
        });
        setStatus("Compartido");
        return;
      }

      // Fallback to URL/text share if file-share is unsupported.
      if (navigator.share) {
        await navigator.share({
          title: "MatecoApp",
          text: shareText,
          url: shareUrl,
        });
        setStatus("Compartido");
        return;
      }

      // Last fallback: copy share URL and expose manual download.
      const copied = await safeCopyText(shareUrl);
      const url = URL.createObjectURL(blob);
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl);
      }
      setDownloadUrl(url);
      setStatus(
        copied
          ? "No hay share nativo. Copiamos el link y podes descargar la imagen."
          : "No hay share nativo. Descarga la imagen y compartila manualmente.",
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo compartir";
      setStatus(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full overflow-hidden rounded-xl">
        <div
          ref={cardRef}
          className={`relative aspect-[3/4] w-full max-w-[400px] overflow-hidden rounded-2xl p-8 shadow-2xl ${getStyleForRole(role)} flex flex-col justify-between`}
        >
          <div
            className="absolute inset-0 opacity-10 mix-blend-overlay"
            style={{
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"noiseFilter\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.65\" numOctaves=\"3\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23noiseFilter)\"/%3E%3C/svg%3E')",
            }}
          />

          <div className="relative z-10 text-center text-xl font-black uppercase tracking-widest opacity-80 mt-4">
            {getTitleForRole(role)}
          </div>

          <div className="relative z-10 flex flex-col items-center gap-6 my-auto">
            <div className={`rounded-full p-2 ${role === "RATA" ? "bg-red-500/20" : "bg-white/10"}`}>
              <Avatar name={userName} src={avatarUrl} />
            </div>
            <div className="text-center">
              <h2 className="text-4xl font-black mb-2">{userName}</h2>
              <p className={`text-lg font-medium opacity-90 p-4 rounded-xl ${role === "RATA" ? "bg-red-950/50" : "bg-black/20"}`}>
                {statsText}
              </p>
            </div>
          </div>

          <div className="relative z-10 pb-4 text-center text-sm font-bold tracking-widest opacity-60">
            CREA TU RONDA EN MATECO.APP
          </div>
        </div>
      </div>

      <Button
        onClick={handleShare}
        disabled={isGenerating}
        className="w-full bg-indigo-500 hover:bg-indigo-600 font-bold tracking-wide min-h-[44px]"
      >
        {isGenerating ? "Generando..." : "Compartir"}
      </Button>

      {downloadUrl ? (
        <a
          href={downloadUrl}
          download={`mateco-${role || "share"}.png`}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-mateco-border bg-mateco-surface px-4 text-sm font-semibold text-zinc-800"
        >
          Descargar imagen
        </a>
      ) : null}

      {status ? <p className="text-center text-xs text-zinc-200">{status}</p> : null}
    </div>
  );
}
