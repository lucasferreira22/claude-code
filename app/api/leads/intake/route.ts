import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { leadIntakeSchema } from "@/lib/validation";
import type { TipoContato } from "@prisma/client";

// ---------------------------------------------------------------------------
// Porta de entrada pública de leads vindos da landing page.
//
// A landing (focus-digital-site) NÃO acessa o banco direto: ela faz um POST
// aqui, autenticando com uma chave secreta (header x-api-key). O CRM continua
// dono das regras — valida e cria o Client com status LEAD.
//
// Configurar a variável LEADS_API_KEY no ambiente (mesma chave na landing).
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  // 1) Autenticação por API key (server-to-server, não exposta no navegador).
  const expected = process.env.LEADS_API_KEY;
  if (!expected) {
    // Falha "fechada": sem chave configurada, não aceita leads.
    return NextResponse.json(
      { error: "Endpoint não configurado" },
      { status: 503 }
    );
  }
  if (req.headers.get("x-api-key") !== expected) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  // 2) Corpo JSON.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // 3) Validação.
  const parsed = leadIntakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0]?.message ?? "Dados inválidos" },
      { status: 422 }
    );
  }
  const data = parsed.data;

  // 4) Monta contatos (só os preenchidos).
  const contatos: { tipo: TipoContato; valor: string }[] = [];
  if (data.email) contatos.push({ tipo: "EMAIL", valor: data.email });
  if (data.whatsapp) contatos.push({ tipo: "WHATSAPP", valor: data.whatsapp });
  if (data.telefone) contatos.push({ tipo: "TELEFONE", valor: data.telefone });

  // 5) Observações: origem + site/rede social + mensagem livre.
  const observacoes = [
    "Lead recebido pela landing page.",
    data.site ? `Site/Rede social: ${data.site}` : null,
    data.mensagem ? `Mensagem: ${data.mensagem}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  // 6) Cria o cliente na primeira etapa do funil, registrando o histórico.
  try {
    const etapa = await prisma.pipelineStage.findFirst({
      orderBy: { ordem: "asc" },
      select: { id: true, nome: true },
    });

    const client = await prisma.client.create({
      data: {
        nomeRazaoSocial: data.nome,
        nicho: data.nicho,
        tipoRelacao: "DIRETO",
        stageId: etapa?.id ?? null,
        categoria: "RECORRENTE",
        observacoes,
        contatos: { create: contatos },
        statusHistory: {
          create: { etapaAnterior: null, etapaNova: etapa?.nome ?? "Lead" },
        },
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, id: client.id }, { status: 201 });
  } catch (err) {
    console.error("Falha ao criar lead:", err);
    return NextResponse.json(
      { error: "Erro ao registrar o lead" },
      { status: 500 }
    );
  }
}
