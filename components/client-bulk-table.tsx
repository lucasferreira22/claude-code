"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";
import {
  bulkDeleteClients,
  bulkUpdateClients,
  type BulkActionState,
} from "@/lib/actions/clients";
import {
  STATUS_BADGE,
  STATUS_LABELS,
  STATUS_ORDER,
  TIPO_RELACAO_LABELS,
  CATEGORIA_LABELS,
  CATEGORIA_ORDER,
  CATEGORIA_BADGE,
  formatCurrency,
} from "@/lib/labels";
import type { Categoria, ClientStatus, TipoRelacao } from "@prisma/client";

export type ClientRow = {
  id: string;
  nomeRazaoSocial: string;
  categoria: Categoria;
  tipoRelacao: TipoRelacao;
  nicho: string | null;
  servicos: string[];
  responsavelNome: string | null;
  partnerAgencyNome: string | null;
  valorMensal: number | null;
  status: ClientStatus;
};

export function ClientBulkTable({
  clients,
  users,
}: {
  clients: ClientRow[];
  users: { id: string; nome: string }[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [campo, setCampo] = useState("categoria");
  const [delState, delAction] = useFormState(bulkDeleteClients, undefined);
  const [updState, updAction] = useFormState(bulkUpdateClients, undefined);

  const allSelected = clients.length > 0 && selected.size === clients.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(clients.map((c) => c.id)));
  }

  const ids = Array.from(selected);
  const hiddenIds = ids.map((id) => (
    <input key={id} type="hidden" name="ids" value={id} />
  ));
  const message = delState?.ok || updState?.ok;
  const error = delState?.error || updState?.error;

  return (
    <div className="space-y-3">
      {/* Barra de ações em massa */}
      {selected.size > 0 && (
        <div className="card flex flex-wrap items-end gap-3 border-accent-subtle-border bg-accent-subtle p-4">
          <span className="text-sm font-medium text-text-primary">
            {selected.size} selecionado(s)
          </span>

          <form action={updAction} className="flex flex-wrap items-end gap-2">
            {hiddenIds}
            <select
              name="campo"
              value={campo}
              onChange={(e) => setCampo(e.target.value)}
              className="input w-auto"
            >
              <option value="categoria">Alterar categoria</option>
              <option value="status">Alterar status</option>
              <option value="responsavel">Alterar responsável</option>
            </select>

            <select name="valor" className="input w-auto" defaultValue="">
              <option value="" disabled>
                Selecione...
              </option>
              {campo === "categoria" &&
                CATEGORIA_ORDER.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORIA_LABELS[c]}
                  </option>
                ))}
              {campo === "status" &&
                STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              {campo === "responsavel" && (
                <>
                  <option value="-">Sem responsável</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nome}
                    </option>
                  ))}
                </>
              )}
            </select>
            <button type="submit" className="btn-secondary">
              Aplicar
            </button>
          </form>

          <form
            action={delAction}
            onSubmit={(e) => {
              if (
                !confirm(
                  `Excluir ${selected.size} cliente(s)? Esta ação não pode ser desfeita.`
                )
              )
                e.preventDefault();
            }}
          >
            {hiddenIds}
            <button
              type="submit"
              className="btn-primary"
            >
              Excluir selecionados
            </button>
          </form>
        </div>
      )}

      {(message || error) && (
        <p
          className={`text-sm ${error ? "text-status-error" : "text-status-success"}`}
          role="status"
        >
          {error || message}
        </p>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border-default bg-surface-elevated text-left text-xs uppercase tracking-wide text-text-muted">
            <tr>
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-border-default"
                  aria-label="Selecionar todos"
                />
              </th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Categoria</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Nicho</th>
              <th className="px-4 py-3">Serviços</th>
              <th className="px-4 py-3">Responsável</th>
              <th className="px-4 py-3">Valor mensal</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {clients.map((c) => (
              <tr
                key={c.id}
                className={selected.has(c.id) ? "bg-accent-subtle" : "hover:bg-surface-hover"}
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(c.id)}
                    onChange={() => toggle(c.id)}
                    className="h-4 w-4 rounded border-border-default"
                    aria-label={`Selecionar ${c.nomeRazaoSocial}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/clientes/${c.id}`}
                    className="font-medium text-accent-primary hover:underline"
                  >
                    {c.nomeRazaoSocial}
                  </Link>
                  {c.partnerAgencyNome && (
                    <div className="text-xs text-text-muted">
                      via {c.partnerAgencyNome}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${CATEGORIA_BADGE[c.categoria]}`}>
                    {CATEGORIA_LABELS[c.categoria]}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {TIPO_RELACAO_LABELS[c.tipoRelacao]}
                </td>
                <td className="px-4 py-3 text-text-secondary">{c.nicho ?? "—"}</td>
                <td className="px-4 py-3 text-text-secondary">
                  {c.servicos.length === 0
                    ? "—"
                    : c.servicos.join(", ")}
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {c.responsavelNome ?? "—"}
                </td>
                <td className="sensivel px-4 py-3 font-mono text-text-secondary">
                  {formatCurrency(c.valorMensal)}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${STATUS_BADGE[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
