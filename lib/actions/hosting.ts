"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// Marca a hospedagem como renovada: empurra a próxima renovação em +1 ano.
// Se não houver data definida, parte de hoje. Cobrança de hospedagem é anual.
export async function markHostingRenewed(clientId: string) {
  const session = await auth();
  if (!session?.user) return;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { dataRenovacao: true },
  });
  if (!client) return;

  const base = client.dataRenovacao ?? new Date();
  const proxima = new Date(base);
  proxima.setFullYear(proxima.getFullYear() + 1);

  await prisma.client.update({
    where: { id: clientId },
    data: { dataRenovacao: proxima },
  });

  revalidatePath("/financeiro/hospedagens");
  revalidatePath("/painel");
  revalidatePath(`/clientes/${clientId}`);
}

// Remove a cobrança de hospedagem do cliente (ex.: ele não renovou mais).
// Limpa também data e valor da renovação: o faturamento e os próximos
// vencimentos leem esses campos direto, então deixá-los preenchidos manteria
// uma receita fantasma mesmo com a hospedagem desmarcada.
export async function removeHosting(clientId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.client.update({
    where: { id: clientId },
    data: {
      possuiHospedagem: false,
      dataRenovacao: null,
      valorRenovacao: null,
    },
  });

  revalidatePath("/financeiro/hospedagens");
  revalidatePath("/financeiro");
  revalidatePath("/painel");
  revalidatePath(`/clientes/${clientId}`);
}
