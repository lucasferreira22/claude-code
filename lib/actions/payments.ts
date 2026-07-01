"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
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

// Alterna o status de uma cobrança (marca/desmarca como paga).
export async function setPaymentStatus(
  paymentId: string,
  status: PaymentStatus
) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status, pagoEm: status === "PAGO" ? new Date() : null },
  });
  revalidateFinanceiro();
}
