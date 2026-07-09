"use client";

import { useRef, useState } from "react";

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

// Busca instantânea sobre uma tabela renderizada no servidor: filtra as linhas
// que tiverem o atributo data-nome, escondendo as que não casam. Reutilizável
// em qualquer tabela (basta pôr data-nome no <tr>).
export function TableSearch({
  children,
  placeholder = "Pesquisar cliente pelo nome...",
}: {
  children: React.ReactNode;
  placeholder?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [visiveis, setVisiveis] = useState<number | null>(null);

  function aplicar(valor: string) {
    setQ(valor);
    const nq = normalizar(valor.trim());
    const linhas = ref.current?.querySelectorAll<HTMLElement>("[data-nome]");
    if (!linhas) return;
    let vis = 0;
    linhas.forEach((row) => {
      const casa = !nq || normalizar(row.dataset.nome ?? "").includes(nq);
      row.hidden = !casa;
      if (casa) vis++;
    });
    setVisiveis(nq ? vis : null);
  }

  return (
    <div className="space-y-3">
      <div className="max-w-sm">
        <input
          type="search"
          value={q}
          onChange={(e) => aplicar(e.target.value)}
          placeholder={placeholder}
          className="input"
        />
        {visiveis !== null && (
          <span className="mt-1 block text-xs text-text-muted">
            {visiveis} resultado(s)
          </span>
        )}
      </div>
      <div ref={ref}>{children}</div>
    </div>
  );
}
