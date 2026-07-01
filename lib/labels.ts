// Mapas de enums (banco) -> rótulos em português (UI)
import type { CSSProperties } from "react";
import type {
  TipoRelacao,
  TipoContato,
  Categoria,
  PaymentStatus,
  Recorrencia,
} from "@prisma/client";

// Etapa do funil (versão leve usada na UI).
export type StageLite = {
  id: string;
  nome: string;
  cor: string | null;
  ordem?: number;
  contaComoAtivo?: boolean;
};

export const STAGE_DEFAULT_COLOR = "#6b7280";

// Paleta de cores sugeridas ao criar/editar uma etapa.
export const STAGE_PRESET_COLORS = [
  "#9ca3af",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#a855f7",
  "#14b8a6",
  "#ec4899",
];

// #rrggbb + alpha (0..1) -> rgba(). Aceita cor nula (usa a padrão).
function hexAlpha(hex: string | null | undefined, alpha: number): string {
  const c = (hex || STAGE_DEFAULT_COLOR).replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Estilo inline de um badge colorido pela cor da etapa (dinâmica).
export function stageBadgeStyle(cor: string | null | undefined): CSSProperties {
  const c = cor || STAGE_DEFAULT_COLOR;
  return {
    backgroundColor: hexAlpha(c, 0.12),
    color: c,
    borderColor: hexAlpha(c, 0.3),
  };
}

export const TIPO_RELACAO_LABELS: Record<TipoRelacao, string> = {
  DIRETO: "Cliente Direto",
  PARCERIA: "Cliente via Parceria",
};

export const CATEGORIA_LABELS: Record<Categoria, string> = {
  RECORRENTE: "Recorrente",
  PONTUAL: "Pontual",
  HOSPEDAGEM: "Hospedagem",
};

export const CATEGORIA_ORDER: Categoria[] = [
  "RECORRENTE",
  "PONTUAL",
  "HOSPEDAGEM",
];

export const CATEGORIA_BADGE: Record<Categoria, string> = {
  RECORRENTE: "bg-accent-subtle text-accent-primary border-accent-primary/20",
  PONTUAL: "bg-surface-elevated text-text-primary border-border-default",
  HOSPEDAGEM: "bg-status-success/10 text-status-success border-status-success/20",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
};

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  PENDENTE: "bg-status-warning/10 text-status-warning border-status-warning/20",
  PAGO: "bg-status-success/10 text-status-success border-status-success/20",
};

// Badge para cobrança em atraso (status derivado na UI, não armazenado).
export const PAYMENT_ATRASADO_BADGE = "bg-status-error/10 text-status-error border-status-error/20";

export const RECORRENCIA_LABELS: Record<Recorrencia, string> = {
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
};

export const TIPO_CONTATO_LABELS: Record<TipoContato, string> = {
  TELEFONE: "Telefone",
  EMAIL: "E-mail",
  WHATSAPP: "WhatsApp",
};

export const TIPO_CONTATO_ORDER: TipoContato[] = [
  "WHATSAPP",
  "TELEFONE",
  "EMAIL",
];

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(d);
}

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

// Competência é a string "AAAA-MM" usada nas cobranças mensais.
export function currentCompetencia(now: Date = new Date()): string {
  const ano = now.getFullYear();
  const mes = String(now.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

export function formatCompetencia(competencia: string): string {
  const [ano, mes] = competencia.split("-");
  const idx = Number(mes) - 1;
  if (idx < 0 || idx > 11) return competencia;
  return `${MESES[idx]}/${ano}`;
}

// Lista de competências (mais recente primeiro) ao redor do mês atual.
export function competenciaOptions(
  back = 11,
  forward = 1,
  now: Date = new Date()
): string[] {
  const out: string[] = [];
  for (let i = forward; i >= -back; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push(currentCompetencia(d));
  }
  return out;
}
