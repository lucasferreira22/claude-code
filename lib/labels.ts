// Mapas de enums (banco) -> rótulos em português (UI)
import type {
  ClientStatus,
  Servico,
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
  RECORRENTE: "bg-blue-100 text-blue-800",
  PONTUAL: "bg-purple-100 text-purple-800",
  HOSPEDAGEM: "bg-teal-100 text-teal-800",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
};

export const PAYMENT_STATUS_BADGE: Record<PaymentStatus, string> = {
  PENDENTE: "bg-amber-100 text-amber-800",
  PAGO: "bg-green-100 text-green-800",
};

// Badge para cobrança em atraso (status derivado na UI, não armazenado).
export const PAYMENT_ATRASADO_BADGE = "bg-red-100 text-red-800";

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
