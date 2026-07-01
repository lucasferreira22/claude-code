"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  chargeCategorySchema,
  customChargeSchema,
} from "@/lib/validation";
import type { PaymentStatus } from "@prisma/client";

function revalidateFinanceiro() {
  revalidatePath("/financeiro", "layout");
  revalidatePath("/painel");
}

// --- Categorias (abas) -------------------------------------------------------

// Cria uma aba de cobrança e redireciona para ela.
export async function createChargeCategory(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = chargeCategorySchema.safeParse({
    nome: formData.get("nome"),
  });
  if (!parsed.success) return;

  const max = await prisma.chargeCategory.aggregate({ _max: { ordem: true } });
  const cat = await prisma.chargeCategory.create({
    data: { nome: parsed.data.nome, ordem: (max._max.ordem ?? 0) + 1 },
  });
  revalidateFinanceiro();
  redirect(`/financeiro/avulsas/${cat.id}`);
}

export async function renameChargeCategory(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = chargeCategorySchema.safeParse({ nome: formData.get("nome") });
  if (!parsed.success) return;

  await prisma.chargeCategory.update({
    where: { id },
    data: { nome: parsed.data.nome },
  });
  revalidateFinanceiro();
}

// Exclui a aba e, em cascata, suas cobranças. Volta para o Financeiro.
export async function deleteChargeCategory(id: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.chargeCategory.delete({ where: { id } });
  revalidateFinanceiro();
  redirect("/financeiro");
}

// --- Cobranças ---------------------------------------------------------------

export async function createCustomCharge(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = customChargeSchema.safeParse({
    categoryId: formData.get("categoryId"),
    clientId: formData.get("clientId"),
    descricao: formData.get("descricao"),
    valor: formData.get("valor"),
    tipo: formData.get("tipo"),
    recorrencia: formData.get("recorrencia") || undefined,
    primeiroVencimento: formData.get("primeiroVencimento"),
  });
  if (!parsed.success) return { error: "Dados inválidos" };

  const d = parsed.data;
  await prisma.customCharge.create({
    data: {
      categoryId: d.categoryId,
      clientId: d.clientId,
      descricao: d.descricao ?? null,
      valor: d.valor,
      tipo: d.tipo,
      recorrencia: d.recorrencia,
      primeiroVencimento: d.primeiroVencimento,
    },
  });
  revalidateFinanceiro();
}

export async function updateCustomCharge(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const parsed = customChargeSchema.safeParse({
    categoryId: formData.get("categoryId"),
    clientId: formData.get("clientId"),
    descricao: formData.get("descricao"),
    valor: formData.get("valor"),
    tipo: formData.get("tipo"),
    recorrencia: formData.get("recorrencia") || undefined,
    primeiroVencimento: formData.get("primeiroVencimento"),
  });
  if (!parsed.success) return { error: "Dados inválidos" };

  const d = parsed.data;
  await prisma.customCharge.update({
    where: { id },
    data: {
      clientId: d.clientId,
      descricao: d.descricao ?? null,
      valor: d.valor,
      tipo: d.tipo,
      recorrencia: d.recorrencia,
      primeiroVencimento: d.primeiroVencimento,
    },
  });
  revalidateFinanceiro();
}

export async function deleteCustomCharge(id: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.customCharge.delete({ where: { id } });
  revalidateFinanceiro();
}

// Marca/desmarca uma cobrança como paga numa competência. Cria a linha de
// status sob demanda (upsert por chargeId+competencia).
export async function setCustomChargeStatus(
  chargeId: string,
  competencia: string,
  status: PaymentStatus
) {
  const session = await auth();
  if (!session?.user) return;
  if (!/^\d{4}-\d{2}$/.test(competencia)) return;

  const pagoEm = status === "PAGO" ? new Date() : null;
  await prisma.customChargePayment.upsert({
    where: { chargeId_competencia: { chargeId, competencia } },
    create: { chargeId, competencia, status, pagoEm },
    update: { status, pagoEm },
  });
  revalidateFinanceiro();
}
