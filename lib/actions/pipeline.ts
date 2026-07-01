"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { STAGE_PRESET_COLORS } from "@/lib/labels";

function revalidar() {
  revalidatePath("/comercial");
  revalidatePath("/clientes");
  revalidatePath("/painel");
  revalidatePath("/financeiro");
}

// Cria uma nova etapa (coluna) no fim do funil.
export async function createStage(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  const agg = await prisma.pipelineStage.aggregate({
    _max: { ordem: true },
    _count: true,
  });
  const cor = STAGE_PRESET_COLORS[agg._count % STAGE_PRESET_COLORS.length];

  await prisma.pipelineStage.create({
    data: { nome, ordem: (agg._max.ordem ?? 0) + 1, cor },
  });
  revalidar();
}

export async function renameStage(id: string, formData: FormData) {
  const session = await auth();
  if (!session?.user) return;

  const nome = String(formData.get("nome") ?? "").trim();
  if (!nome) return;

  await prisma.pipelineStage.update({ where: { id }, data: { nome } });
  revalidar();
}

// Define a cor da etapa (hex).
export async function setStageCor(id: string, cor: string) {
  const session = await auth();
  if (!session?.user) return;
  if (!/^#[0-9a-fA-F]{6}$/.test(cor)) return;

  await prisma.pipelineStage.update({ where: { id }, data: { cor } });
  revalidar();
}

// Marca/desmarca a etapa como "conta como cliente ativo" (para o Financeiro).
export async function setStageAtivo(id: string, contaComoAtivo: boolean) {
  const session = await auth();
  if (!session?.user) return;

  await prisma.pipelineStage.update({
    where: { id },
    data: { contaComoAtivo },
  });
  revalidar();
}

// Move a etapa uma posição para a esquerda (-1) ou direita (+1), trocando a
// ordem com a vizinha.
export async function moveStage(id: string, dir: -1 | 1) {
  const session = await auth();
  if (!session?.user) return;

  const stages = await prisma.pipelineStage.findMany({
    orderBy: { ordem: "asc" },
    select: { id: true, ordem: true },
  });
  const idx = stages.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const alvo = idx + dir;
  if (alvo < 0 || alvo >= stages.length) return;

  const a = stages[idx];
  const b = stages[alvo];
  await prisma.$transaction([
    prisma.pipelineStage.update({ where: { id: a.id }, data: { ordem: b.ordem } }),
    prisma.pipelineStage.update({ where: { id: b.id }, data: { ordem: a.ordem } }),
  ]);
  revalidar();
}

// Exclui uma etapa. Os clientes dela são movidos para outra etapa (a primeira
// restante, por ordem). Não permite excluir a última etapa.
export async function deleteStage(id: string) {
  const session = await auth();
  if (!session?.user) return;

  const stages = await prisma.pipelineStage.findMany({
    orderBy: { ordem: "asc" },
    select: { id: true },
  });
  if (stages.length <= 1) return; // precisa sobrar ao menos uma etapa

  const destino = stages.find((s) => s.id !== id);
  if (!destino) return;

  await prisma.$transaction([
    prisma.client.updateMany({
      where: { stageId: id },
      data: { stageId: destino.id },
    }),
    prisma.pipelineStage.delete({ where: { id } }),
  ]);
  revalidar();
}
