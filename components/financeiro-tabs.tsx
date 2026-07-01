"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createChargeCategory } from "@/lib/actions/custom-charges";

type Categoria = { id: string; nome: string };

const fixas = [
  { href: "/financeiro", label: "Resumo" },
  { href: "/financeiro/cobrancas", label: "Cobranças recorrentes mensais" },
  { href: "/financeiro/hospedagens", label: "Hospedagens" },
];

export function FinanceiroTabs({ categorias }: { categorias: Categoria[] }) {
  const pathname = usePathname();
  const [novaAberta, setNovaAberta] = useState(false);

  const tabClass = (active: boolean) =>
    `-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "border-accent-primary text-accent-primary"
        : "border-transparent text-text-secondary hover:text-text-primary"
    }`;

  return (
    <nav className="flex flex-wrap items-center gap-1 border-b border-border-default">
      {fixas.map((tab) => {
        // "Resumo" só fica ativo no /financeiro exato (senão casaria com tudo).
        const active =
          tab.href === "/financeiro"
            ? pathname === "/financeiro"
            : pathname.startsWith(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className={tabClass(active)}>
            {tab.label}
          </Link>
        );
      })}

      {categorias.map((cat) => {
        const href = `/financeiro/avulsas/${cat.id}`;
        return (
          <Link
            key={cat.id}
            href={href}
            className={tabClass(pathname.startsWith(href))}
          >
            {cat.nome}
          </Link>
        );
      })}

      <div className="relative">
        <button
          type="button"
          onClick={() => setNovaAberta((v) => !v)}
          className="-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-text-muted hover:text-accent-primary"
          title="Criar nova aba de cobrança"
        >
          + Nova aba
        </button>
        {novaAberta && (
          <form
            action={createChargeCategory}
            className="absolute left-0 z-20 mt-1 w-64 rounded-md border border-border-default bg-surface-elevated p-3 shadow-float"
          >
            <label className="label">Nome da aba</label>
            <input
              type="text"
              name="nome"
              autoFocus
              required
              placeholder="Ex.: Criação de Sites"
              className="input"
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNovaAberta(false)}
                className="btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Criar
              </button>
            </div>
          </form>
        )}
      </div>
    </nav>
  );
}
