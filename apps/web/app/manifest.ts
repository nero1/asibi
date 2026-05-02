import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Asibi",
    short_name: "Asibi",
    description: "Offline CHW climate triage",
    start_url: "/",
    display: "standalone",
    background_color: "#f9fafb",
    theme_color: "#0ea5e9",
    icons: []
  };
}
