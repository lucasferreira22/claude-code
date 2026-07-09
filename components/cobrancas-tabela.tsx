"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { setPaymentStatus } from "@/lib/actions/payments";
import {
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_ATRASADO_BADGE,
  formatCurrency,
} from "@/lib/labels";

export type CobrancaRow = {
  paymentId: string;
  clienteId: string;
  clienteNome: string;
  diaVencimento: number | null;
  valor: number;
  status: "PAGO" | "PENDENTE";
  atrasada: boolean;
  whatsappHref: string | null;
};

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function CobrancasTabela({ rows }: { rows: CobrancaRow[] }) {
  const [busca, setBusca] = useState("");

  const q = normalizar(busca.trim());
  const visiveis = useMemo(
    () => (q ? rows.filter((r) => normalizar(r.clienteNome).includes(q)) : rows),
    [q, rows]
  );

  return (
    <div className="space-y-3">
      <div className="relative max-w-sm">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Pesquisar cliente pelo nome..."
          className="input"
        />
        {q && (
          <span className="mt-1 block text-xs text-text-muted">
            {visiveis.length} resultado(s)
          </span>
        )}
      </div>

      {visiveis.length === 0 ? (
        <div className="card p-10 text-center text-text-secondary">
          Nenhuma cobrança encontrada.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border-default bg-surface-elevated text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {visiveis.map((r) => {
                const marcar = setPaymentStatus.bind(
                  null,
                  r.paymentId,
                  r.status === "PAGO" ? "PENDENTE" : "PAGO"
                );
                return (
                  <tr key={r.paymentId} className="hover:bg-surface-elevated">
                    <td className="px-4 py-3">
                      <Link
                        href={`/clientes/${r.clienteId}`}
                        className="font-medium text-accent-primary hover:underline"
                      >
                        {r.clienteNome}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {r.diaVencimento ? `Dia ${r.diaVencimento}` : "—"}
                    </td>
                    <td className="sensivel px-4 py-3 text-right text-text-primary">
                      {formatCurrency(r.valor)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          r.atrasada
                            ? PAYMENT_ATRASADO_BADGE
                            : PAYMENT_STATUS_BADGE[r.status]
                        }`}
                      >
                        {r.atrasada
                          ? "Atrasado"
                          : PAYMENT_STATUS_LABELS[r.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {r.whatsappHref && (
                          <a
                            href={r.whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar lembrete no WhatsApp"
                            className="btn-whatsapp"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              className="h-4 w-4 fill-current"
                              aria-hidden="true"
                            >
                              <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.4.8-1.4.1-.2 0-.4 0-.5 0-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3 1.9.7 2.6.8 3.5.7.6-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.2-.3-.2-.6-.3z" />
                              <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20z" />
                            </svg>
                            Lembrar
                          </a>
                        )}
                        <form action={marcar}>
                          <button
                            type="submit"
                            className={
                              r.status === "PAGO" ? "btn-secondary" : "btn-primary"
                            }
                          >
                            {r.status === "PAGO" ? "Desfazer" : "Marcar pago"}
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
