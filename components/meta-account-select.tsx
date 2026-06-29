"use client";

import { useMemo, useState } from "react";

type Conta = { id: string; nome: string };

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

// Combobox com pesquisa para escolher a conta de anúncio do Meta.
// Guarda o valor escolhido num input oculto name="metaAdAccountId".
export function MetaAccountSelect({
  accounts,
  defaultValue = "",
}: {
  accounts: Conta[];
  defaultValue?: string;
}) {
  const inicial = accounts.find((a) => a.id === defaultValue);
  const [selectedId, setSelectedId] = useState(defaultValue);
  const [label, setLabel] = useState(
    inicial ? `${inicial.nome} — ${inicial.id}` : defaultValue
  );
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtradas = useMemo(() => {
    const q = norm(query.trim());
    const base = q
      ? accounts.filter((a) => norm(a.nome).includes(q) || a.id.includes(q))
      : accounts;
    return base.slice(0, 60);
  }, [query, accounts]);

  function escolher(a: Conta | null) {
    setSelectedId(a ? a.id : "");
    setLabel(a ? `${a.nome} — ${a.id}` : "");
    setQuery("");
    setOpen(false);
  }

  return (
    <div className="relative sm:max-w-md">
      <input type="hidden" name="metaAdAccountId" value={selectedId} />
      <input
        type="text"
        className="input"
        placeholder="Pesquise pelo nome ou act_..."
        value={open ? query : label}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />

      {open && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => escolher(null)}
            className="block w-full px-3 py-2 text-left text-sm text-gray-400 hover:bg-gray-50"
          >
            — Nenhuma —
          </button>
          {filtradas.map((a) => (
            <button
              key={a.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => escolher(a)}
              className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                a.id === selectedId ? "bg-brand-50" : ""
              }`}
            >
              <span className="text-gray-800">{a.nome}</span>
              <span className="ml-1 text-xs text-gray-400">{a.id}</span>
            </button>
          ))}
          {filtradas.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">
              Nenhuma conta encontrada.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
