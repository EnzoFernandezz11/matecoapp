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
        src: "/icons/mate.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
