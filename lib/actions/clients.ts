"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { clientSchema } from "@/lib/validation";
import type { ClientStatus, Servico, TipoContato } from "@prisma/client";

const CONTATO_TIPOS: TipoContato[] = ["WHATSAPP", "TELEFONE", "EMAIL"];

function parseClientForm(formData: FormData) {
  const servicos = formData.getAll("servicos").map(String) as Servico[];

  const contatos = CONTATO_TIPOS.map((tipo) => ({
    tipo,
    valor: String(formData.get(`contato_${tipo}`) ?? "").trim(),
  })).filter((c) => c.valor !== "");

  const tipoRelacao = String(formData.get("tipoRelacao") ?? "");

  return {
    nomeRazaoSocial: String(formData.get("nomeRazaoSocial") ?? ""),
    cnpj: String(formData.get("cnpj") ?? ""),
    nicho: String(formData.get("nicho") ?? ""),
    cidade: String(formData.get("cidade") ?? ""),
    estado: String(formData.get("estado") ?? ""),
    tipoRelacao,
    // Só vincula agência se for parceria
    partnerAgencyId:
      tipoRelacao === "PARCERIA"
        ? String(formData.get("partnerAgencyId") ?? "")
        : "",
    responsavelId: String(formData.get("responsavelId") ?? ""),
    status: String(formData.get("status") ?? "LEAD"),
    categoria: String(formData.get("categoria") ?? "RECORRENTE"),
    dataInicioContrato: String(formData.get("dataInicioContrato") ?? ""),
    dataFimContrato: String(formData.get("dataFimContrato") ?? ""),
    valorMensal: String(formData.get("valorMensal") ?? ""),
    observacoes: String(formData.get("observacoes") ?? ""),
    servicos,
    contatos,
  };
}

export type ActionState = { error?: string } | undefined;

export async function createClient(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado" };

  const parsed = clientSchema.safeParse(parseClientForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  if (data.tipoRelacao === "PARCERIA" && !data.partnerAgencyId) {
    return { error: "Selecione a agência parceira" };
  }

  const client = await prisma.client.create({
    data: {
      nomeRazaoSocial: data.nomeRazaoSocial,
      cnpj: data.cnpj,
      nicho: data.nicho,
      cidade: data.cidade,
      estado: data.estado,
      tipoRelacao: data.tipoRelacao,
      partnerAgencyId:
        data.tipoRelacao === "PARCERIA" ? data.partnerAgencyId : null,
      responsavelId: data.responsavelId || null,
      status: data.status,
      categoria: data.categoria,
      dataInicioContrato: data.dataInicioContrato ?? null,
      dataFimContrato: data.dataFimContrato ?? null,
      valorMensal: data.valorMensal ?? null,
      observacoes: data.observacoes,
      servicos: { create: data.servicos.map((servico) => ({ servico })) },
      contatos: { create: data.contatos },
      statusHistory: {
        create: {
          statusAnterior: null,
          statusNovo: data.status,
          alteradoPorId: session.user.id,
        },
      },
    },
  });

  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}`);
}

export async function updateClient(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Não autenticado" };

  const parsed = clientSchema.safeParse(parseClientForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos" };
  }
  const data = parsed.data;

  if (data.tipoRelacao === "PARCERIA" && !data.partnerAgencyId) {
    return { error: "Selecione a agência parceira" };
  }

  const existing = await prisma.client.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!existing) return { error: "Cliente não encontrado" };

  const statusMudou = existing.status !== data.status;

  await prisma.$transaction(async (tx) => {
    await tx.clientService.deleteMany({ where: { clientId: id } });
    await tx.clientContact.deleteMany({ where: { clientId: id } });

    await tx.client.update({
      where: { id },
      data: {
        nomeRazaoSocial: data.nomeRazaoSocial,
        cnpj: data.cnpj,
        nicho: data.nicho,
        cidade: data.cidade,
        estado: data.estado,
        tipoRelacao: data.tipoRelacao,
        partnerAgencyId:
          data.tipoRelacao === "PARCERIA" ? data.partnerAgencyId : null,
        responsavelId: data.responsavelId || null,
        status: data.status,
        categoria: data.categoria,
        dataInicioContrato: data.dataInicioContrato ?? null,
        dataFimContrato: data.dataFimContrato ?? null,
        valorMensal: data.valorMensal ?? null,
        observacoes: data.observacoes,
        servicos: { create: data.servicos.map((servico) => ({ servico })) },
        contatos: { create: data.contatos },
      },
    });

    if (statusMudou) {
      await tx.clientStatusHistory.create({
        data: {
          clientId: id,
          statusAnterior: existing.status,
          statusNovo: data.status,
          alteradoPorId: session.user.id,
        },
      });
    }
  });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}`);
}

export async function updateClientStatus(clientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const novo = String(formData.get("status") ?? "") as ClientStatus;
  const valid: ClientStatus[] = [
    "LEAD",
    "EM_NEGOCIACAO",
    "ATIVO",
    "PAUSADO",
    "ENCERRADO",
  ];
  if (!valid.includes(novo)) return;

  const existing = await prisma.client.findUnique({
    where: { id: clientId },
    select: { status: true },
  });
  if (!existing || existing.status === novo) return;

  await prisma.$transaction([
    prisma.client.update({ where: { id: clientId }, data: { status: novo } }),
    prisma.clientStatusHistory.create({
      data: {
        clientId,
        statusAnterior: existing.status,
        statusNovo: novo,
        alteradoPorId: session.user.id,
      },
    }),
  ]);

  revalidatePath(`/clientes/${clientId}`);
  revalidatePath("/clientes");
}

export async function deleteClient(id: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.client.delete({ where: { id } });
  revalidatePath("/clientes");
  redirect("/clientes");
}

export async function addNote(clientId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const conteudo = String(formData.get("conteudo") ?? "").trim();
  if (!conteudo) return;

  await prisma.clientNote.create({
    data: { clientId, conteudo, autorId: session.user.id },
  });
  revalidatePath(`/clientes/${clientId}`);
}

export async function deleteNote(noteId: string, clientId: string) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.clientNote.delete({ where: { id: noteId } });
  revalidatePath(`/clientes/${clientId}`);
}
