"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type { Categoria, TipoContato, TipoRelacao } from "@prisma/client";
import type { ImportRow, ImportResult } from "@/lib/import-fields";

function normalize(s: string | undefined): string {
  return (s ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function parseTipoRelacao(v: string | undefined): TipoRelacao {
  const n = normalize(v);
  if (n.includes("parc") || n.includes("b2b")) return "PARCERIA";
  return "DIRETO";
}

// Texto do CSV -> nome canônico de etapa (para casar com pipeline_stages).
function parseStatusNome(v: string | undefined): string {
  const n = normalize(v);
  if (n.includes("ativ")) return "Ativo";
  if (n.includes("paus")) return "Pausado";
  if (n.includes("encerr") || n.includes("cancel")) return "Encerrado";
  if (n.includes("negoc")) return "Em Negociação";
  return "Lead";
}

function parseCategoria(v: string | undefined): Categoria {
  const n = normalize(v);
  if (n.includes("pontual") || n.includes("avulso")) return "PONTUAL";
  if (n.includes("hosped")) return "HOSPEDAGEM";
  return "RECORRENTE";
}

// Reconhece serviços no texto e devolve os NOMES canônicos do catálogo.
// (Os nomes são resolvidos para IDs do catálogo em importClients.)
function parseServicos(v: string | undefined): string[] {
  const n = normalize(v);
  const out = new Set<string>();
  if (n.includes("meta") || n.includes("facebook") || n.includes("insta"))
    out.add("Meta Ads");
  if (n.includes("google")) out.add("Google Ads");
  if (n.includes("tiktok") || n.includes("tik tok")) out.add("TikTok Ads");
  if (n.includes("social") || n.includes("midia social") || n.includes("smm"))
    out.add("Social Media");
  if (n.includes("site") || n.includes("web") || n.includes("landing"))
    out.add("Criação de Site");
  if (n.includes("ambos") || n.includes("todos")) {
    out.add("Meta Ads");
    out.add("Google Ads");
  }
  if (n.includes("outro")) out.add("Outros");
  return Array.from(out);
}

function parseDecimal(v: string | undefined): number | null {
  if (!v || v.trim() === "") return null;
  const normalized = v.replace(/[^\d.,-]/g, "").replace(/\./g, "").replace(",", ".");
  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
}

function parseDayOfMonth(v: string | undefined): number | null {
  if (!v || v.trim() === "") return null;
  const n = Number(v.trim().replace(/\D/g, ""));
  return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
}

function parseDate(v: string | undefined): Date | null {
  if (!v || v.trim() === "") return null;
  const t = v.trim();
  // dd/mm/yyyy
  const br = t.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (br) {
    const [, d, m, y] = br;
    const year = y.length === 2 ? `20${y}` : y;
    const date = new Date(Number(year), Number(m) - 1, Number(d));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  const date = new Date(t);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function importClients(rows: ImportRow[]): Promise<ImportResult> {
  const session = await auth();
  if (!session?.user) {
    return { created: 0, skipped: 0, errors: [{ linha: 0, mensagem: "Não autenticado" }] };
  }

  const result: ImportResult = { created: 0, skipped: 0, errors: [] };

  // cache de agências e usuários por nome normalizado
  const agencies = await prisma.partnerAgency.findMany({
    select: { id: true, nome: true },
  });
  const agencyByName = new Map(agencies.map((a) => [normalize(a.nome), a.id]));

  const users = await prisma.user.findMany({ select: { id: true, nome: true } });
  const userByName = new Map(users.map((u) => [normalize(u.nome), u.id]));

  // catálogo de serviços por nome normalizado (para resolver nome -> id)
  const services = await prisma.service.findMany({
    select: { id: true, nome: true },
  });
  const serviceIdByName = new Map(
    services.map((s) => [normalize(s.nome), s.id])
  );

  // etapas do funil por nome normalizado + etapa padrão (primeira por ordem)
  const stages = await prisma.pipelineStage.findMany({
    orderBy: { ordem: "asc" },
    select: { id: true, nome: true },
  });
  const stageByName = new Map(stages.map((s) => [normalize(s.nome), s]));
  const defaultStage = stages[0] ?? null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const linha = i + 2; // +2: cabeçalho + base 1
    const nome = (row.nomeRazaoSocial ?? "").trim();

    if (!nome) {
      result.skipped++;
      continue;
    }

    try {
      const tipoRelacao = parseTipoRelacao(row.tipoRelacao);

      let partnerAgencyId: string | null = null;
      if (tipoRelacao === "PARCERIA" && row.nomeAgencia?.trim()) {
        const key = normalize(row.nomeAgencia);
        partnerAgencyId = agencyByName.get(key) ?? null;
        if (!partnerAgencyId) {
          const created = await prisma.partnerAgency.create({
            data: { nome: row.nomeAgencia.trim() },
          });
          partnerAgencyId = created.id;
          agencyByName.set(key, created.id);
        }
      }

      const responsavelId = row.responsavelNome
        ? userByName.get(normalize(row.responsavelNome)) ?? null
        : null;

      const etapa =
        stageByName.get(normalize(parseStatusNome(row.status))) ?? defaultStage;
      const categoria = parseCategoria(row.categoria);
      // nomes reconhecidos -> ids do catálogo (ignora os que não existem)
      const serviceIds = parseServicos(row.servicos)
        .map((nome) => serviceIdByName.get(normalize(nome)))
        .filter((id): id is string => Boolean(id));

      const contatos: { tipo: TipoContato; valor: string }[] = [];
      if (row.contatoWhatsapp?.trim())
        contatos.push({ tipo: "WHATSAPP", valor: row.contatoWhatsapp.trim() });
      if (row.contatoTelefone?.trim())
        contatos.push({ tipo: "TELEFONE", valor: row.contatoTelefone.trim() });
      if (row.contatoEmail?.trim())
        contatos.push({ tipo: "EMAIL", valor: row.contatoEmail.trim() });

      await prisma.client.create({
        data: {
          nomeRazaoSocial: nome,
          nicho: row.nicho?.trim() || null,
          tipoRelacao,
          partnerAgencyId,
          responsavelId,
          stageId: etapa?.id ?? null,
          categoria,
          dataInicioContrato: parseDate(row.dataInicioContrato),
          valorMensal: parseDecimal(row.valorMensal),
          custoMensal: parseDecimal(row.custoMensal),
          diaVencimento: parseDayOfMonth(row.diaVencimento),
          possuiHospedagem:
            categoria === "HOSPEDAGEM" ||
            parseDate(row.dataRenovacao) != null ||
            parseDecimal(row.valorRenovacao) != null,
          dataRenovacao: parseDate(row.dataRenovacao),
          valorRenovacao: parseDecimal(row.valorRenovacao),
          observacoes: row.observacoes?.trim() || null,
          servicos: { create: serviceIds.map((serviceId) => ({ serviceId })) },
          contatos: { create: contatos },
          statusHistory: {
            create: {
              etapaAnterior: null,
              etapaNova: etapa?.nome ?? "Lead",
              alteradoPorId: session.user.id,
            },
          },
        },
      });
      result.created++;
    } catch (e) {
      result.errors.push({
        linha,
        mensagem: e instanceof Error ? e.message : "Erro ao importar",
      });
    }
  }

  revalidatePath("/clientes");
  return result;
}
