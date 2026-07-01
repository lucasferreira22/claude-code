"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { setClientStatus } from "@/lib/actions/clients";
import {
  STATUS_ORDER,
  STATUS_LABELS,
  STATUS_BADGE,
  CATEGORIA_LABELS,
  CATEGORIA_BADGE,
  formatCurrency,
} from "@/lib/labels";
import type { ClientStatus, Categoria } from "@prisma/client";

export type KanbanCard = {
  id: string;
  nomeRazaoSocial: string;
  status: ClientStatus;
  categoria: Categoria;
  valorMensal: number | null;
  responsavelNome: string | null;
  partnerAgencyNome: string | null;
};

// Cor da borda esquerda do card por status (acento visual).
const STATUS_ACCENT: Record<ClientStatus, string> = {
  LEAD: "border-l-text-muted",
  EM_NEGOCIACAO: "border-l-status-warning",
  ATIVO: "border-l-status-success",
  PAUSADO: "border-l-status-info",
  ENCERRADO: "border-l-status-error",
};

// Remove acentos e caixa para uma busca tolerante.
function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function KanbanBoard({ initial }: { initial: KanbanCard[] }) {
  const [cards, setCards] = useState<KanbanCard[]>(initial);
  const [busca, setBusca] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ClientStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  const q = normalizar(busca.trim());
  const filtrados = q
    ? cards.filter((c) => normalizar(c.nomeRazaoSocial).includes(q))
    : cards;

  function handleDrop(e: React.DragEvent, status: ClientStatus) {
    e.preventDefault();
    setOverCol(null);
    const id = e.dataTransfer.getData("text/plain");
    setDragId(null);
    if (!id) return;

    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;

    // Snapshot para reverter caso a ação falhe.
    const snapshot = cards;
    // Atualização otimista: muda o status e move o card para o TOPO da coluna
    // (início do array), para ele aparecer na primeira posição ao ser solto.
    setCards((prev) => {
      const movido = prev.find((c) => c.id === id);
      if (!movido) return prev;
      const resto = prev.filter((c) => c.id !== id);
      return [{ ...movido, status }, ...resto];
    });
    startTransition(async () => {
      try {
        await setClientStatus(id, status);
      } catch {
        setCards(snapshot);
      }
    });
  }

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
            {filtrados.length} resultado(s)
          </span>
        )}
      </div>

      <div
        className={`flex h-[calc(100vh-16rem)] gap-4 overflow-x-auto pb-1 ${
          isPending ? "opacity-95" : ""
        }`}
      >
        {STATUS_ORDER.map((status) => {
          const colCards = filtrados.filter((c) => c.status === status);
        const isOver = overCol === status;
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(status);
            }}
            onDragLeave={() =>
              setOverCol((s) => (s === status ? null : s))
            }
            onDrop={(e) => handleDrop(e, status)}
            className={`flex h-full w-72 shrink-0 flex-col rounded-card border p-3 transition-all duration-200 ${
              isOver
                ? "border-accent-primary bg-accent-subtle shadow-hover"
                : "border-border-default bg-surface-card"
            }`}
          >
            {/* Visual Concept: status connection indicator */}
            <div className="relative mb-3 flex items-center justify-between px-1">
              <span className={`badge ${STATUS_BADGE[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <span className="text-xs nums font-medium text-text-muted">
                {colCards.length}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {colCards.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-text-muted">
                  Arraste clientes para cá
                </p>
              ) : (
                colCards.map((card) => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", card.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDragId(card.id);
                    }}
                    onDragEnd={() => setDragId(null)}
                    className={`cursor-grab rounded-card border border-border-default border-l-4 bg-surface-page p-3 shadow-card hover:shadow-hover hover:bg-surface-hover active:cursor-grabbing transition-all duration-200 ${
                      STATUS_ACCENT[card.status]
                    } ${dragId === card.id ? "opacity-30 scale-95" : ""}`}
                  >
                    <Link
                      href={`/clientes/${card.id}`}
                      className="font-medium text-accent-primary hover:underline"
                      draggable={false}
                    >
                      {card.nomeRazaoSocial}
                    </Link>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span
                        className={`badge ${CATEGORIA_BADGE[card.categoria]}`}
                      >
                        {CATEGORIA_LABELS[card.categoria]}
                      </span>
                      {card.valorMensal ? (
                        <span className="sensivel text-xs nums text-text-secondary">
                          {formatCurrency(card.valorMensal)}/mês
                        </span>
                      ) : null}
                    </div>
                    {(card.responsavelNome || card.partnerAgencyNome) && (
                      <p className="mt-1 truncate text-xs text-text-muted">
                        {card.partnerAgencyNome
                          ? `via ${card.partnerAgencyNome}`
                          : card.responsavelNome}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          );
        })}
      </div>
    </div>
  );
}
