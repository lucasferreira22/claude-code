import type { MetadataRoute } from "next";

// Manifest do app instalável (PWA). É o que dá o ícone e o nome corretos
// quando o CRM é adicionado à tela de início no Android/Chrome.
// No iOS, quem manda é o app/apple-icon.png.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CRM Focus Digital",
    short_name: "Focus CRM",
    description: "Gestão de clientes — Focus Digital",
    start_url: "/painel",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#e5142b",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      // Versão "maskable": o Android recorta o ícone (círculo/squircle) e
      // recomenda manter a arte dentro de um círculo de 80% do lado — por
      // isso este arquivo usa a arte menor que os de cima.
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
