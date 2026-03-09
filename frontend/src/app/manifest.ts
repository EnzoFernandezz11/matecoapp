import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MatecoApp",
    short_name: "Mateco",
    description: "Organiza rondas de mate entre estudiantes",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8F6",
    theme_color: "#FFFFFF",
    orientation: "portrait",
    lang: "es",
    icons: [
      {
        src: "/icons/mate-apple.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/mate-apple.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
