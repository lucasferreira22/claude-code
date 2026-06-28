// Mapas de enums (banco) -> rótulos em português (UI)
import type {
  ClientStatus,
  TipoRelacao,
  TipoContato,
  Categoria,
  PaymentStatus,
} from "@prisma/client";

export const STATUS_LABELS: Record<ClientStatus, string> = {
  LEAD: "Lead",
  EM_NEGOCIACAO: "Em Negociação",
  ATIVO: "Ativo",
  PAUSADO: "Pausado",
  ENCERRADO: "Encerrado",
};

export const STATUS_ORDER: ClientStatus[] = [
  "LEAD",
  "EM_NEGOCIACAO",
  "ATIVO",
  "PAUSADO",
  "ENCERRADO",
];

export const STATUS_BADGE: Record<ClientStatus, string> = {
  LEAD: "bg-surface-elevated text-text-secondary border-border-default",
  EM_NEGOCIACAO: "bg-status-warning/10 text-status-warning border-status-warning/20",
  ATIVO: "bg-status-success/10 text-status-success border-status-success/20",
  PAUSADO: "bg-accent-subtle text-accent-primary border-accent-primary/20",
  ENCERRADO: "bg-status-error/10 text-status-error border-status-error/20",
};

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
