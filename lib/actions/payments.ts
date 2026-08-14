"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { parseValorBR } from "@/lib/finance";
import type { PaymentStatus } from "@prisma/client";

function revalidateFinanceiro() {
  revalidatePath("/financeiro/cobrancas");
  revalidatePath("/painel");
  revalidatePath("/financeiro");
}

// Gera as cobranças do mês: cria uma Payment PENDENTE (valor = valorMensal) para
// cada cliente RECORRENTE + ATIVO com valor mensal. Pula quem já tem cobrança no
// mês (graças ao índice único clientId+competencia).
export async function generateMonthlyPayments(competencia: string) {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado" };
  if (!/^\d{4}-\d{2}$/.test(competencia))
    return { error: "Competência inválida" };

  const clients = await prisma.client.findMany({
    where: {
      stage: { contaComoAtivo: true },
      categoria: "RECORRENTE",
      valorMensal: { not: null },
    },
    select: { id: true, valorMensal: true },
  });

  const data = clients.map((c) => ({
    clientId: c.id,
    competencia,
    valor: c.valorMensal!,
    status: "PENDENTE" as PaymentStatus,
  }));

  const res = await prisma.payment.createMany({ data, skipDuplicates: true });
  revalidateFinanceiro();
  return { ok: `${res.count} cobrança(s) geradas para ${competencia}.` };
}

// Alterna o status de uma cobrança (marca/desmarca como paga). Ao marcar como
// paga, registra o valor cheio como recebido; ao desfazer, zera o recebido.
export async function setPaymentStatus(
  paymentId: string,
  status: PaymentStatus
) {
  const session = await auth();
  if (!session?.user) return;

  const atual = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { valor: true },
  });
  if (!atual) return;

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      status,
      valorPago: status === "PAGO" ? atual.valor : null,
      pagoEm: status === "PAGO" ? new Date() : null,
    },
  });
  revalidateFinanceiro();
}

// Registra um pagamento parcial: grava quanto já foi recebido e mantém a
// cobrança pendente enquanto faltar valor. Se o valor informado cobrir o
// total, a cobrança passa a PAGO.
export async function setPaymentPartial(
  paymentId: string,
  formData: FormData
) {
  const session = await auth();
  if (!session?.user) return;

  const atual = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { valor: true },
  });
  if (!atual) return;

  const recebido = parseValorBR(formData.get("valorPago"));
  if (recebido == null) return;

  const total = Number(atual.valor);
  const valorPago = Math.min(Math.max(recebido, 0), total);
  const quitado = valorPago >= total;

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      valorPago: valorPago > 0 ? valorPago : null,
      status: quitado ? "PAGO" : "PENDENTE",
      pagoEm: quitado ? new Date() : null,
    },
  });
  revalidateFinanceiro();
}

// Exclui uma cobrança do mês (ex.: cliente encerrou/pausou e não vai pagar
// esta competência). Se o cliente ainda for recorrente ativo, ela pode voltar
// ao clicar em "Gerar cobranças do mês".
export async function deletePayment(paymentId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.payment.delete({ where: { id: paymentId } });
  revalidateFinanceiro();
}
