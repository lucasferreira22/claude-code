"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { agencySchema } from "@/lib/validation";
import type { ActionState } from "@/lib/actions/clients";

function parseAgencyForm(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? ""),
    contatoNome: String(formData.get("contatoNome") ?? ""),
    contatoEmail: String(formData.get("contatoEmail") ?? ""),
    contatoTelefone: String(formData.get("contatoTelefone") ?? ""),
    modeloComissao: String(formData.get("modeloComissao") ?? ""),
    percentualComissao: String(formData.get("percentualComissao") ?? ""),
    observacoes: String(formData.get("observacoes") ?? ""),
  };
}

export async function createAgency(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado" };

  const parsed = agencySchema.safeParse(parseAgencyForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  const agency = await prisma.partnerAgency.create({
    data: {
      nome: data.nome,
      contatoNome: data.contatoNome,
      contatoEmail: data.contatoEmail,
      contatoTelefone: data.contatoTelefone,
      modeloComissao: data.modeloComissao,
      percentualComissao: data.percentualComissao ?? null,
      observacoes: data.observacoes,
    },
  });

  revalidatePath("/agencias");
  redirect(`/agencias/${agency.id}`);
}

export async function updateAgency(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado" };

  const parsed = agencySchema.safeParse(parseAgencyForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  await prisma.partnerAgency.update({
    where: { id },
    data: {
      nome: data.nome,
      contatoNome: data.contatoNome,
      contatoEmail: data.contatoEmail,
      contatoTelefone: data.contatoTelefone,
      modeloComissao: data.modeloComissao,
      percentualComissao: data.percentualComissao ?? null,
      observacoes: data.observacoes,
    },
  });

  revalidatePath("/agencias");
  revalidatePath(`/agencias/${id}`);
  redirect(`/agencias/${id}`);
}

export async function deleteAgency(id: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.partnerAgency.delete({ where: { id } });
  revalidatePath("/agencias");
  redirect("/agencias");
}
