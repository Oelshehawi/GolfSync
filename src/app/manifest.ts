import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Quilchena Golf Club",
    short_name: "Quilchena Golf",
    description:
      "Golf club management system for booking tee times and managing your membership",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#06466c",
    orientation: "portrait-primary",
    scope: "/",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
    categories: ["sports", "lifestyle"],
    lang: "en",
    dir: "ltr",
  };
}
