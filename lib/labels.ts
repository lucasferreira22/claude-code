// Mapas de enums (banco) -> rótulos em português (UI)
import type {
  ClientStatus,
  Servico,
  TipoRelacao,
  TipoContato,
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
  LEAD: "bg-gray-100 text-gray-700",
  EM_NEGOCIACAO: "bg-amber-100 text-amber-800",
  ATIVO: "bg-green-100 text-green-800",
  PAUSADO: "bg-orange-100 text-orange-800",
  ENCERRADO: "bg-red-100 text-red-800",
};

export const TIPO_RELACAO_LABELS: Record<TipoRelacao, string> = {
  DIRETO: "Cliente Direto",
  PARCERIA: "Cliente via Parceria",
};

export const SERVICO_LABELS: Record<Servico, string> = {
  META_ADS: "Meta Ads",
  GOOGLE_ADS: "Google Ads",
  OUTROS: "Outros",
};

export const SERVICO_ORDER: Servico[] = ["META_ADS", "GOOGLE_ADS", "OUTROS"];

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
