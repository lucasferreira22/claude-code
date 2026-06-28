"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import {
  createService,
  toggleServiceAtivo,
  deleteService,
} from "@/lib/actions/services";

export type ServiceRow = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  clientes: number;
  parentId: string | null;
};

function AddButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Adicionando..." : "Adicionar"}
    </button>
  );
}

export function ServiceManager({
  services,
  categorias,
}: {
  services: ServiceRow[];
  categorias: { id: string; nome: string }[];
}) {
  const [createState, createAction] = useFormState(createService, undefined);
  const [rowMsg, setRowMsg] = useState<{ error?: string; ok?: string } | null>(
    null
  );
  const [, startTransition] = useTransition();

  function onToggle(id: string, ativo: boolean) {
    setRowMsg(null);
    startTransition(() => {
      toggleServiceAtivo(id, ativo);
    });
  }

  function onDelete(id: string, nome: string) {
    if (!confirm(`Excluir o serviço "${nome}"?`)) return;
    setRowMsg(null);
    startTransition(async () => {
      const r = await deleteService(id);
      setRowMsg(r ?? null);
    });
  }

  // Ordena: cada categoria de topo seguida dos seus filhos.
  const topo = services.filter((s) => !s.parentId);
  const filhosDe = (id: string) => services.filter((s) => s.parentId === id);
  const linhas: { s: ServiceRow; nivel: number; categoria: boolean }[] = [];
  for (const t of topo) {
    const filhos = filhosDe(t.id);
    linhas.push({ s: t, nivel: 0, categoria: filhos.length > 0 });
    for (const f of filhos) linhas.push({ s: f, nivel: 1, categoria: false });
  }

  return (
    <div className="space-y-6">
      {/* Adicionar serviço */}
      <form
        action={createAction}
        className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
      >
        <div>
          <label className="label">Nome do serviço *</label>
          <input
            name="nome"
            required
            placeholder="Ex: LinkedIn Ads"
            className="input"
          />
        </div>
        <div>
          <label className="label">Descrição</label>
          <input
            name="descricao"
            placeholder="Opcional"
            className="input"
          />
        </div>
        <div>
          <label className="label">Categoria</label>
          <select name="parentId" defaultValue="" className="input">
            <option value="">— Nenhuma (item de topo)</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
        </div>
        <AddButton />
        {createState?.error && (
          <p className="text-sm text-status-error lg:col-span-4">
            {createState.error}
          </p>
        )}
        {createState?.ok && (
          <p className="text-sm text-status-success lg:col-span-4">
            {createState.ok}
          </p>
        )}
      </form>

      <p className="text-xs text-text-muted">
        Dica: deixe a categoria em branco para criar um item de topo (que pode
        virar categoria ao receber subserviços). Ex: crie “Tráfego Pago” como
        topo e cadastre “Meta Ads” com a categoria “Tráfego Pago”.
      </p>

      {rowMsg?.error && <p className="text-sm text-status-error">{rowMsg.error}</p>}
      {rowMsg?.ok && <p className="text-sm text-status-success">{rowMsg.ok}</p>}

      {/* Lista */}
      {services.length === 0 ? (
        <div className="card p-10 text-center text-text-secondary">
          Nenhum serviço cadastrado ainda.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border-default bg-surface-elevated text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">Serviço</th>
                <th className="px-4 py-3">Clientes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {linhas.map(({ s, nivel, categoria }) => (
                <tr key={s.id} className={s.ativo ? "" : "bg-surface-elevated/60"}>
                  <td className="px-4 py-3">
                    <div style={{ paddingLeft: nivel * 20 }}>
                      <p className="flex items-center gap-2 font-medium text-text-primary">
                        {nivel > 0 && (
                          <span className="text-text-muted">↳</span>
                        )}
                        {s.nome}
                        {categoria && (
                          <span className="badge bg-accent-subtle text-accent-primary">
                            categoria
                          </span>
                        )}
                      </p>
                      {s.descricao && (
                        <p className="text-xs text-text-muted">{s.descricao}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">
                    {categoria ? "—" : s.clientes}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`badge ${
                        s.ativo
                          ? "badge-success"
                          : "bg-surface-elevated text-text-secondary"
                      }`}
                    >
                      {s.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => onToggle(s.id, !s.ativo)}
                        className="text-sm text-text-secondary hover:underline"
                      >
                        {s.ativo ? "Desativar" : "Ativar"}
                      </button>
                      <Link
                        href={`/servicos/${s.id}/editar`}
                        className="text-sm text-accent-primary hover:underline"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(s.id, s.nome)}
                        className="text-sm text-status-error hover:underline"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
