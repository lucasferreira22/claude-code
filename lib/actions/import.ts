"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import type {
  Categoria,
  ClientStatus,
  Servico,
  TipoContato,
  TipoRelacao,
} from "@prisma/client";
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

function parseStatus(v: string | undefined): ClientStatus {
  const n = normalize(v);
  if (n.includes("ativ")) return "ATIVO";
  if (n.includes("paus")) return "PAUSADO";
  if (n.includes("encerr") || n.includes("cancel")) return "ENCERRADO";
  if (n.includes("negoc")) return "EM_NEGOCIACAO";
  if (n.includes("lead")) return "LEAD";
  return "LEAD";
}

function parseCategoria(v: string | undefined): Categoria {
  const n = normalize(v);
  if (n.includes("pontual") || n.includes("avulso")) return "PONTUAL";
  if (n.includes("hosped")) return "HOSPEDAGEM";
  return "RECORRENTE";
}

function parseServicos(v: string | undefined): Servico[] {
  const n = normalize(v);
  const out = new Set<Servico>();
  if (n.includes("meta") || n.includes("facebook") || n.includes("insta"))
    out.add("META_ADS");
  if (n.includes("google")) out.add("GOOGLE_ADS");
  if (n.includes("tiktok") || n.includes("tik tok")) out.add("TIKTOK_ADS");
  if (n.includes("social") || n.includes("midia social") || n.includes("smm"))
    out.add("SOCIAL_MEDIA");
  if (n.includes("site") || n.includes("web") || n.includes("landing"))
    out.add("CRIACAO_SITE");
  if (n.includes("ambos") || n.includes("todos")) {
    out.add("META_ADS");
    out.add("GOOGLE_ADS");
  }
  if (n.includes("outro")) out.add("OUTROS");
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

      const status = parseStatus(row.status);
      const categoria = parseCategoria(row.categoria);
      const servicos = parseServicos(row.servicos);

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
          status,
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
          servicos: { create: servicos.map((servico) => ({ servico })) },
          contatos: { create: contatos },
          statusHistory: {
            create: {
              statusAnterior: null,
              statusNovo: status,
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
