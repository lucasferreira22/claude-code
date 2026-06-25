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
  LEAD: "border-l-gray-400",
  EM_NEGOCIACAO: "border-l-amber-400",
  ATIVO: "border-l-green-500",
  PAUSADO: "border-l-orange-400",
  ENCERRADO: "border-l-red-400",
};

export function KanbanBoard({ initial }: { initial: KanbanCard[] }) {
  const [cards, setCards] = useState<KanbanCard[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<ClientStatus | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDrop(e: React.DragEvent, status: ClientStatus) {
    e.preventDefault();
    setOverCol(null);
    const id = e.dataTransfer.getData("text/plain");
    setDragId(null);
    if (!id) return;

    const card = cards.find((c) => c.id === id);
    if (!card || card.status === status) return;

    const anterior = card.status;
    // Atualização otimista; reverte se a ação falhar.
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status } : c))
    );
    startTransition(async () => {
      try {
        await setClientStatus(id, status);
      } catch {
        setCards((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: anterior } : c))
        );
      }
    });
  }

  return (
    <div
      className={`flex h-[calc(100vh-12rem)] gap-4 overflow-x-auto pb-1 ${
        isPending ? "opacity-95" : ""
      }`}
    >
      {STATUS_ORDER.map((status) => {
        const colCards = cards.filter((c) => c.status === status);
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
            className={`flex h-full w-72 shrink-0 flex-col rounded-lg border p-2 transition-colors ${
              isOver
                ? "border-brand-400 bg-brand-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className={`badge ${STATUS_BADGE[status]}`}>
                {STATUS_LABELS[status]}
              </span>
              <span className="text-xs font-medium text-gray-400">
                {colCards.length}
              </span>
            </div>

            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
              {colCards.length === 0 ? (
                <p className="px-1 py-6 text-center text-xs text-gray-300">
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
                    className={`cursor-grab rounded-md border border-l-4 bg-white p-3 shadow-sm active:cursor-grabbing ${
                      STATUS_ACCENT[card.status]
                    } ${dragId === card.id ? "opacity-40" : ""}`}
                  >
                    <Link
                      href={`/clientes/${card.id}`}
                      className="font-medium text-brand-700 hover:underline"
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
                        <span className="text-xs text-gray-500">
                          {formatCurrency(card.valorMensal)}/mês
                        </span>
                      ) : null}
                    </div>
                    {(card.responsavelNome || card.partnerAgencyNome) && (
                      <p className="mt-1 truncate text-xs text-gray-400">
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
  );
}
