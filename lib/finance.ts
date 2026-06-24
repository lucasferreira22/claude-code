// Cálculos financeiros reutilizados por Painel, Financeiro e Cobranças.
// Funções puras (sem acesso a banco) — recebem os clientes já carregados.
import type { Categoria, ClientStatus, TipoRelacao } from "@prisma/client";
import { CATEGORIA_ORDER, STATUS_ORDER } from "@/lib/labels";

// Converte Prisma.Decimal | number | null em número (ou null).
export function num(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v as number);
  return Number.isNaN(n) ? null : n;
}

export type FinanceClient = {
  id: string;
  nomeRazaoSocial: string;
  categoria: Categoria;
  status: ClientStatus;
  tipoRelacao: TipoRelacao;
  valorMensal: unknown;
  custoMensal: unknown;
  diaVencimento: number | null;
  dataRenovacao: Date | null;
  valorRenovacao: unknown;
  partnerAgency: { id: string; nome: string; percentualComissao: unknown } | null;
};

export type FinanceSummary = {
  faturamentoMensal: number; // soma de valorMensal dos clientes ATIVOS
  custoMensal: number; // soma de custoMensal dos clientes ATIVOS
  comissoes: number; // comissões devidas a agências parceiras (ATIVOS)
  lucro: number; // faturamento - custo - comissões
  totalClientes: number;
  porCategoria: Record<Categoria, { count: number; faturamento: number }>;
  porStatus: Record<ClientStatus, number>;
};

function emptyPorCategoria(): Record<Categoria, { count: number; faturamento: number }> {
  return CATEGORIA_ORDER.reduce(
    (acc, c) => {
      acc[c] = { count: 0, faturamento: 0 };
      return acc;
    },
    {} as Record<Categoria, { count: number; faturamento: number }>
  );
}

function emptyPorStatus(): Record<ClientStatus, number> {
  return STATUS_ORDER.reduce(
    (acc, s) => {
      acc[s] = 0;
      return acc;
    },
    {} as Record<ClientStatus, number>
  );
}

// Comissão mensal de um cliente de parceria (valorMensal × percentual/100).
export function comissaoCliente(c: FinanceClient): number {
  if (c.tipoRelacao !== "PARCERIA" || !c.partnerAgency) return 0;
  const pct = num(c.partnerAgency.percentualComissao);
  const valor = num(c.valorMensal);
  if (!pct || !valor) return 0;
  return (valor * pct) / 100;
}

export function summarize(clients: FinanceClient[]): FinanceSummary {
  const porCategoria = emptyPorCategoria();
  const porStatus = emptyPorStatus();
  let faturamentoMensal = 0;
  let custoMensal = 0;
  let comissoes = 0;

  for (const c of clients) {
    porStatus[c.status]++;
    porCategoria[c.categoria].count++;

    if (c.status === "ATIVO") {
      const v = num(c.valorMensal) ?? 0;
      faturamentoMensal += v;
      porCategoria[c.categoria].faturamento += v;
      custoMensal += num(c.custoMensal) ?? 0;
      comissoes += comissaoCliente(c);
    }
  }

  return {
    faturamentoMensal,
    custoMensal,
    comissoes,
    lucro: faturamentoMensal - custoMensal - comissoes,
    totalClientes: clients.length,
    porCategoria,
    porStatus,
  };
}

// Comissões agregadas por agência parceira (apenas clientes ATIVOS).
export type ComissaoAgencia = {
  agenciaId: string;
  nome: string;
  faturamento: number;
  comissao: number;
};

export function comissoesPorAgencia(clients: FinanceClient[]): ComissaoAgencia[] {
  const map = new Map<string, ComissaoAgencia>();
  for (const c of clients) {
    if (c.status !== "ATIVO" || c.tipoRelacao !== "PARCERIA" || !c.partnerAgency)
      continue;
    const ag = c.partnerAgency;
    const cur =
      map.get(ag.id) ??
      { agenciaId: ag.id, nome: ag.nome, faturamento: 0, comissao: 0 };
    cur.faturamento += num(c.valorMensal) ?? 0;
    cur.comissao += comissaoCliente(c);
    map.set(ag.id, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.comissao - a.comissao);
}

// ---------------------------------------------------------------------------
// Próximos vencimentos / renovações
// ---------------------------------------------------------------------------
export type Vencimento = {
  clientId: string;
  nome: string;
  tipo: "MENSAL" | "RENOVACAO";
  data: Date;
  valor: number | null;
  emDias: number; // negativo = já venceu
};

function diffDias(de: Date, ate: Date): number {
  const MS = 24 * 60 * 60 * 1000;
  const a = new Date(de.getFullYear(), de.getMonth(), de.getDate());
  const b = new Date(ate.getFullYear(), ate.getMonth(), ate.getDate());
  return Math.round((b.getTime() - a.getTime()) / MS);
}

// Próxima ocorrência de um dia do mês a partir de hoje (ajusta meses curtos).
function proximaDataDoDia(dia: number, hoje: Date): Date {
  const ultimoDiaMesAtual = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0
  ).getDate();
  const diaEsteMes = Math.min(dia, ultimoDiaMesAtual);
  if (diaEsteMes >= hoje.getDate()) {
    return new Date(hoje.getFullYear(), hoje.getMonth(), diaEsteMes);
  }
  const ultimoDiaProx = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 2,
    0
  ).getDate();
  return new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    Math.min(dia, ultimoDiaProx)
  );
}

export function proximosVencimentos(
  clients: FinanceClient[],
  dias = 14,
  hoje: Date = new Date()
): Vencimento[] {
  const out: Vencimento[] = [];

  for (const c of clients) {
    // Pagamento recorrente mensal (apenas clientes ativos com dia definido)
    if (c.status === "ATIVO" && c.diaVencimento) {
      const data = proximaDataDoDia(c.diaVencimento, hoje);
      const emDias = diffDias(hoje, data);
      if (emDias >= 0 && emDias <= dias) {
        out.push({
          clientId: c.id,
          nome: c.nomeRazaoSocial,
          tipo: "MENSAL",
          data,
          valor: num(c.valorMensal),
          emDias,
        });
      }
    }

    // Renovação de hospedagem/domínio (data específica; inclui recém-vencidas)
    if (c.dataRenovacao) {
      const emDias = diffDias(hoje, c.dataRenovacao);
      if (emDias >= -7 && emDias <= dias) {
        out.push({
          clientId: c.id,
          nome: c.nomeRazaoSocial,
          tipo: "RENOVACAO",
          data: c.dataRenovacao,
          valor: num(c.valorRenovacao),
          emDias,
        });
      }
    }
  }

  return out.sort((a, b) => a.emDias - b.emDias);
}
