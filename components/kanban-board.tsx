"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { setClientStage } from "@/lib/actions/clients";
import {
  createStage,
  renameStage,
  setStageCor,
  setStageAtivo,
  moveStage,
  deleteStage,
} from "@/lib/actions/pipeline";
import {
  CATEGORIA_LABELS,
  CATEGORIA_BADGE,
  STAGE_PRESET_COLORS,
  STAGE_DEFAULT_COLOR,
  stageBadgeStyle,
  formatCurrency,
  type StageLite,
} from "@/lib/labels";
import type { Categoria } from "@prisma/client";

export type KanbanCard = {
  id: string;
  nomeRazaoSocial: string;
  stageId: string | null;
  categoria: Categoria;
  valorMensal: number | null;
  responsavelNome: string | null;
  partnerAgencyNome: string | null;
};

function normalizar(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function KanbanBoard({
  initial,
  stages,
}: {
  initial: KanbanCard[];
  stages: StageLite[];
}) {
  const [cards, setCards] = useState<KanbanCard[]>(initial);
  const [busca, setBusca] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Ressincroniza com o servidor quando os dados mudam (mover/renomear/excluir
  // coluna revalidam a página). Usa uma assinatura estável para não estourar
  // a cada render nem apagar o estado otimista antes da confirmação.
  const sig = initial.map((c) => `${c.id}:${c.stageId}`).join("|");
  useEffect(() => {
    setCards(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  const q = normalizar(busca.trim());
  const filtrados = q
    ? cards.filter((c) => normalizar(c.nomeRazaoSocial).includes(q))
    : cards;

  function handleDrop(e: React.DragEvent, stageId: string) {
    e.preventDefault();
    setOverCol(null);
    const id = e.dataTransfer.getData("text/plain");
    setDragId(null);
    if (!id) return;

    const card = cards.find((c) => c.id === id);
    if (!card || card.stageId === stageId) return;

    const snapshot = cards;
    // Otimista: muda a etapa e leva o card ao topo da coluna.
    setCards((prev) => {
      const movido = prev.find((c) => c.id === id);
      if (!movido) return prev;
      const resto = prev.filter((c) => c.id !== id);
      return [{ ...movido, stageId }, ...resto];
    });
    startTransition(async () => {
      try {
        await setClientStage(id, stageId);
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

      <div className="flex h-[calc(100vh-16rem)] gap-4 overflow-x-auto pb-1">
        {stages.map((stage, idx) => {
          const colCards = filtrados.filter((c) => c.stageId === stage.id);
          const isOver = overCol === stage.id;
          const cor = stage.cor || STAGE_DEFAULT_COLOR;
          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setOverCol(stage.id);
              }}
              onDragLeave={() =>
                setOverCol((s) => (s === stage.id ? null : s))
              }
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`flex h-full w-72 shrink-0 flex-col rounded-card border p-3 transition-all duration-200 ${
                isOver
                  ? "border-accent-primary bg-accent-subtle shadow-hover"
                  : "border-border-default bg-surface-card"
              }`}
            >
              <StageHeader
                stage={stage}
                count={colCards.length}
                isFirst={idx === 0}
                isLast={idx === stages.length - 1}
                canDelete={stages.length > 1}
              />

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
                      style={{ borderLeftColor: cor }}
                      className={`cursor-grab rounded-card border border-border-default border-l-4 bg-surface-page p-3 shadow-card hover:shadow-hover hover:bg-surface-hover active:cursor-grabbing transition-all duration-200 ${
                        dragId === card.id ? "opacity-30 scale-95" : ""
                      }`}
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

        {/* Coluna para adicionar nova etapa */}
        <NovaColuna />
      </div>
    </div>
  );
}

// Cabeçalho de uma coluna, com engrenagem que abre o editor.
function StageHeader({
  stage,
  count,
  isFirst,
  isLast,
  canDelete,
}: {
  stage: StageLite;
  count: number;
  isFirst: boolean;
  isLast: boolean;
  canDelete: boolean;
}) {
  const [editando, setEditando] = useState(false);
  const [, startTransition] = useTransition();

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between px-1">
        <span className="badge" style={stageBadgeStyle(stage.cor)}>
          {stage.nome}
          {stage.contaComoAtivo && (
            <span className="ml-1" title="Conta como cliente ativo (financeiro)">
              ●
            </span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <span className="text-xs nums font-medium text-text-muted">
            {count}
          </span>
          <button
            type="button"
            onClick={() => setEditando((v) => !v)}
            title="Editar coluna"
            className="rounded p-1 text-text-muted hover:bg-surface-hover hover:text-text-primary"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path d="M8.34 1.8a1 1 0 0 1 .95-.68h1.42a1 1 0 0 1 .95.68l.3.9a6.9 6.9 0 0 1 1.06.6l.92-.24a1 1 0 0 1 1.1.45l.72 1.24a1 1 0 0 1-.16 1.2l-.66.66c.03.2.05.4.05.62s-.02.42-.05.62l.66.66a1 1 0 0 1 .16 1.2l-.72 1.24a1 1 0 0 1-1.1.45l-.92-.24c-.33.24-.69.44-1.06.6l-.3.9a1 1 0 0 1-.95.68H9.29a1 1 0 0 1-.95-.68l-.3-.9a6.9 6.9 0 0 1-1.06-.6l-.92.24a1 1 0 0 1-1.1-.45l-.72-1.24a1 1 0 0 1 .16-1.2l.66-.66a5.3 5.3 0 0 1 0-1.24l-.66-.66a1 1 0 0 1-.16-1.2l.72-1.24a1 1 0 0 1 1.1-.45l.92.24c.33-.24.69-.44 1.06-.6l.3-.9ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
          </button>
        </div>
      </div>

      {editando && (
        <div className="mt-2 space-y-3 rounded-md border border-border-default bg-surface-elevated p-3 shadow-float">
          {/* Renomear */}
          <form action={renameStage.bind(null, stage.id)} className="flex gap-2">
            <input
              type="text"
              name="nome"
              defaultValue={stage.nome}
              required
              className="input"
            />
            <button type="submit" className="btn-primary">
              OK
            </button>
          </form>

          {/* Cor */}
          <div>
            <p className="label">Cor</p>
            <div className="flex flex-wrap gap-1.5">
              {STAGE_PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  title={c}
                  onClick={() =>
                    startTransition(() => setStageCor(stage.id, c))
                  }
                  style={{ backgroundColor: c }}
                  className={`h-6 w-6 rounded-full border-2 ${
                    (stage.cor || "").toLowerCase() === c
                      ? "border-text-primary"
                      : "border-transparent"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Conta como ativo */}
          <label className="flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              defaultChecked={stage.contaComoAtivo}
              onChange={(e) =>
                startTransition(() => setStageAtivo(stage.id, e.target.checked))
              }
            />
            Conta como cliente ativo (entra no faturamento)
          </label>

          {/* Mover / excluir */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1">
              <button
                type="button"
                disabled={isFirst}
                onClick={() => startTransition(() => moveStage(stage.id, -1))}
                className="btn-secondary disabled:opacity-40"
                title="Mover para a esquerda"
              >
                ◀
              </button>
              <button
                type="button"
                disabled={isLast}
                onClick={() => startTransition(() => moveStage(stage.id, 1))}
                className="btn-secondary disabled:opacity-40"
                title="Mover para a direita"
              >
                ▶
              </button>
            </div>
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Excluir a coluna "${stage.nome}"? Os clientes nela serão movidos para outra etapa.`
                    )
                  )
                    startTransition(() => deleteStage(stage.id));
                }}
                className="btn-secondary text-status-error"
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Coluna final: criar nova etapa.
function NovaColuna() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="flex h-full w-64 shrink-0 flex-col">
      {aberto ? (
        <form
          action={createStage}
          className="rounded-card border border-dashed border-border-default bg-surface-card p-3"
        >
          <label className="label">Nome da coluna</label>
          <input
            type="text"
            name="nome"
            autoFocus
            required
            placeholder="Ex.: Proposta enviada"
            className="input"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setAberto(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Criar
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="rounded-card border border-dashed border-border-default p-3 text-sm font-medium text-text-muted hover:border-accent-primary hover:text-accent-primary"
        >
          + Nova coluna
        </button>
      )}
    </div>
  );
}
