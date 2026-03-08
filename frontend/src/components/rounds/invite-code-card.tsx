"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function InviteCodeCard({ code, link, title = "Invitacion creada" }: { code: string; link: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator;
  const message = `Unite a mi ronda de mate con este link: ${link}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(link)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = async () => {
    if (!canNativeShare) {
      return;
    }
    await navigator.share({
      title: "Invitacion a ronda",
      text: "Unite a mi ronda de mate",
      url: link,
    });
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  };

  return (
    <Card>
      <h3 className="text-base font-bold text-zinc-900">{title}</h3>
      <p className="mt-1 text-sm text-zinc-600">Codigo: <span className="font-bold">{code}</span></p>
      <p className="mt-1 break-all text-xs text-zinc-500">{link}</p>
      <div className="mt-3 flex justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-3">
        <img src={qrUrl} alt="QR de invitacion" className="h-40 w-40 rounded-lg" />
      </div>
      <Button className="mt-3" variant="secondary" onClick={handleCopy}>
        {copied ? "Copiado" : "Copiar link"}
      </Button>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
      >
        Compartir por WhatsApp
      </a>
      {canNativeShare ? (
        <Button className="mt-2" variant="secondary" onClick={handleShare}>
          {shared ? "Compartido" : "Compartir..."}
        </Button>
      ) : null}
    </Card>
  );
}
