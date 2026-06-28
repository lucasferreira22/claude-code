import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Focus Digital",
  description: "Gestão de clientes — Focus Digital",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        {/* Google Fonts — Inter (tipografia principal do design system) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Aplica o modo privacidade antes da pintura, evitando "piscar" os
            valores quando a opção está ativa. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var d=document.documentElement;if(localStorage.getItem('dadosOcultos')==='1')d.classList.add('dados-ocultos');if(localStorage.getItem('tema')==='dark')d.classList.add('dark')}catch(e){}",
          }}
        />
      </head>
      <body style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{children}</body>
    </html>
  );
}
