"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export type ServiceActionState = { error?: string; ok?: string } | undefined;

function revalidate() {
  revalidatePath("/servicos");
  revalidatePath("/clientes");
}

export async function createService(
  _prev: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado" };

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const parentId = String(formData.get("parentId") ?? "").trim() || null;
  if (!nome) return { error: "Informe o nome do serviço" };

  const existing = await prisma.service.findUnique({ where: { nome } });
  if (existing) return { error: "Já existe um serviço com esse nome" };

  await prisma.service.create({ data: { nome, descricao, parentId } });
  revalidate();
  return { ok: `Serviço "${nome}" criado.` };
}

export async function updateService(
  id: string,
  _prev: ServiceActionState,
  formData: FormData
): Promise<ServiceActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado" };

  const nome = String(formData.get("nome") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim() || null;
  const ativo = formData.get("ativo") === "on";
  let parentId = String(formData.get("parentId") ?? "").trim() || null;
  if (!nome) return { error: "Informe o nome do serviço" };
  if (parentId === id) parentId = null; // não pode ser pai de si mesmo

  const dup = await prisma.service.findUnique({ where: { nome } });
  if (dup && dup.id !== id)
    return { error: "Já existe outro serviço com esse nome" };

  await prisma.service.update({
    where: { id },
    data: { nome, descricao, ativo, parentId },
  });
  revalidate();
  return { ok: "Serviço atualizado." };
}

// Liga/desliga o serviço (não aparece no cadastro de novos clientes quando inativo).
export async function toggleServiceAtivo(id: string, ativo: boolean) {
  const session = await auth();
  if (!session?.user) return;
  await prisma.service.update({ where: { id }, data: { ativo } });
  revalidate();
}

export async function deleteService(id: string): Promise<ServiceActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado" };

  const emUso = await prisma.clientService.count({ where: { serviceId: id } });
  if (emUso > 0) {
    return {
      error: `Este serviço está vinculado a ${emUso} cliente(s). Desative-o em vez de excluir.`,
    };
  }

  await prisma.service.delete({ where: { id } });
  revalidate();
  return { ok: "Serviço excluído." };
}
