"use client";

import { useEffect, useState } from "react";

// Botão de "olhinho" que oculta (borra) os valores sensíveis em todo o app.
// A preferência é salva no localStorage e aplicada via classe no <html>.
export function PrivacyToggle() {
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    setOculto(document.documentElement.classList.contains("dados-ocultos"));
  }, []);

  function toggle() {
    const novo = !oculto;
    setOculto(novo);
    document.documentElement.classList.toggle("dados-ocultos", novo);
    try {
      localStorage.setItem("dadosOcultos", novo ? "1" : "0");
    } catch {
      /* ignora indisponibilidade de localStorage */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={oculto ? "Mostrar valores" : "Ocultar valores"}
      aria-label={oculto ? "Mostrar valores" : "Ocultar valores"}
      className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
    >
      {oculto ? (
        // olho cortado (valores ocultos)
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <line x1="2" y1="2" x2="22" y2="22" />
        </svg>
      ) : (
        // olho aberto (valores visíveis)
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );
}
