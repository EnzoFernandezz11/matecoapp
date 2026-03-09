"use client";

export type ShareResult =
  | "native_file"
  | "native_text"
  | "copied"
  | "whatsapp"
  | "unsupported";

type ShareOptions = {
  title: string;
  text: string;
  url?: string;
  files?: File[];
};

function canShareFiles(files: File[]): boolean {
  if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
    return false;
  }
  const n = navigator as Navigator & {
    canShare?: (data?: ShareData) => boolean;
  };
  return Boolean(n.canShare?.({ files }));
}

async function copyText(value: string): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    return false;
  }
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

export async function shareWithFallback(options: ShareOptions): Promise<ShareResult> {
  const { title, text, url, files } = options;

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      if (files && files.length > 0 && canShareFiles(files)) {
        await navigator.share({ title, text, files });
        return "native_file";
      }
      await navigator.share({ title, text, url });
      return "native_text";
    } catch (error) {
      const err = error as Error;
      if (err?.name === "AbortError") {
        return "unsupported";
      }
    }
  }

  const fallbackText = [text, url].filter(Boolean).join(" ");
  if (await copyText(fallbackText)) {
    return "copied";
  }

  if (typeof window !== "undefined") {
    const wa = `https://wa.me/?text=${encodeURIComponent(fallbackText)}`;
    window.open(wa, "_blank", "noopener,noreferrer");
    return "whatsapp";
  }

  return "unsupported";
}

export async function canvasToPngFile(
  canvas: HTMLCanvasElement,
  filename: string,
): Promise<File | null> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });
  if (!blob) {
    return null;
  }
  return new File([blob], filename, { type: "image/png" });
}
