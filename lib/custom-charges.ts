// Lógica das cobranças avulsas: quando uma cobrança "vence" numa competência
// (mês), e quanto elas somam ao faturamento do mês. Funções puras — recebem os
// dados já carregados do banco.
import type { Recorrencia, TipoCobranca } from "@prisma/client";
import { num } from "@/lib/finance";
import { currentCompetencia } from "@/lib/labels";

export type ChargeOccurrenceInput = {
  tipo: TipoCobranca;
  recorrencia: Recorrencia | null;
  primeiroVencimento: Date;
  ativo: boolean;
};

// Passo (em meses) de cada periodicidade.
const PASSO_MESES: Record<Recorrencia, number> = {
  MENSAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

// "AAAA-MM" de uma data.
export function competenciaDe(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  return `${ano}-${mes}`;
}

// Diferença em meses entre duas competências "AAAA-MM" (b - a).
export function mesesEntre(a: string, b: string): number {
  const [ay, am] = a.split("-").map(Number);
  const [by, bm] = b.split("-").map(Number);
  return (by - ay) * 12 + (bm - am);
}

// A cobrança vence na competência informada?
//  - Pontual: só no mês do 1º vencimento.
//  - Recorrente: em intervalos regulares (passo da periodicidade) a partir do
//    1º vencimento — nunca antes dele.
export function venceEm(
  charge: ChargeOccurrenceInput,
  competencia: string
): boolean {
  if (!charge.ativo) return false;
  const inicio = competenciaDe(charge.primeiroVencimento);
  const diff = mesesEntre(inicio, competencia);
  if (diff < 0) return false; // antes do início não cobra

  if (charge.tipo === "PONTUAL") return diff === 0;
  if (!charge.recorrencia) return diff === 0;
  return diff % PASSO_MESES[charge.recorrencia] === 0;
}

// Dia do mês do vencimento (derivado da data-âncora).
export function diaVencimentoDe(charge: { primeiroVencimento: Date }): number {
  return charge.primeiroVencimento.getDate();
}

// Faturamento das cobranças avulsas que vencem numa competência (valor cheio,
// pontuais + recorrentes), somado por padrão no mês atual.
export function faturamentoAvulsasDoMes(
  charges: (ChargeOccurrenceInput & { valor: unknown })[],
  competencia: string = currentCompetencia()
): number {
  let total = 0;
  for (const c of charges) {
    if (venceEm(c, competencia)) total += num(c.valor) ?? 0;
  }
  return total;
}
