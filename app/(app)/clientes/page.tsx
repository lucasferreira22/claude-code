import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Categoria, Prisma, TipoRelacao } from "@prisma/client";
import { CATEGORIA_LABELS, CATEGORIA_ORDER } from "@/lib/labels";
import { ClientBulkTable } from "@/components/client-bulk-table";

type SearchParams = {
  q?: string;
  tipo?: string;
  stage?: string;
  categoria?: string;
  nicho?: string;
  responsavel?: string;
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const stages = await prisma.pipelineStage.findMany({
    orderBy: { ordem: "asc" },
    select: { id: true, nome: true, cor: true, contaComoAtivo: true },
  });
  const stageIds = new Set(stages.map((s) => s.id));

  const where: Prisma.ClientWhereInput = {};

  if (searchParams.q) {
    where.nomeRazaoSocial = { contains: searchParams.q, mode: "insensitive" };
  }
  if (searchParams.tipo === "DIRETO" || searchParams.tipo === "PARCERIA") {
    where.tipoRelacao = searchParams.tipo as TipoRelacao;
  }
  // Filtro padrão = primeira etapa "ativa" quando a página abre sem filtro.
  // Selecionar "Todos" envia stage="" (string vazia), o que remove o filtro.
  const stageAtivoPadrao = stages.find((s) => s.contaComoAtivo)?.id ?? "";
  const stageFiltro =
    searchParams.stage === undefined ? stageAtivoPadrao : searchParams.stage;
  if (stageFiltro && stageIds.has(stageFiltro)) {
    where.stageId = stageFiltro;
  }
  if (
    searchParams.categoria &&
    CATEGORIA_ORDER.includes(searchParams.categoria as Categoria)
  ) {
    where.categoria = searchParams.categoria as Categoria;
  }
  if (searchParams.nicho) {
    where.nicho = searchParams.nicho;
  }
  if (searchParams.responsavel) {
    where.responsavelId = searchParams.responsavel;
  }

  const [clients, nichos, users, total] = await Promise.all([
    prisma.client.findMany({
      where,
      include: {
        stage: { select: { id: true, nome: true, cor: true } },
        partnerAgency: { select: { nome: true } },
        responsavel: { select: { nome: true } },
        servicos: { include: { service: { select: { nome: true } } } },
      },
      orderBy: { nomeRazaoSocial: "asc" },
    }),
    prisma.client.findMany({
      where: { nicho: { not: null } },
      select: { nicho: true },
      distinct: ["nicho"],
      orderBy: { nicho: "asc" },
    }),
    prisma.user.findMany({ select: { id: true, nome: true }, orderBy: { nome: "asc" } }),
    prisma.client.count(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-text-secondary">
            {clients.length} de {total} cliente(s)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/importar" className="btn-secondary">
            Importar CSV
          </Link>
          <Link href="/clientes/novo" className="btn-primary">
            + Novo cliente
          </Link>
        </div>
      </div>

      <form
        method="GET"
        className="card grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="lg:col-span-2">
          <label className="label">Buscar por nome</label>
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q}
            placeholder="Nome do cliente..."
            className="input"
          />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select name="tipo" defaultValue={searchParams.tipo} className="input">
            <option value="">Todos</option>
            <option value="DIRETO">Direto</option>
            <option value="PARCERIA">Parceria</option>
          </select>
        </div>
        <div>
          <label className="label">Etapa</label>
          <select name="stage" defaultValue={stageFiltro} className="input">
            <option value="">Todas</option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Categoria</label>
          <select
            name="categoria"
            defaultValue={searchParams.categoria}
            className="input"
          >
            <option value="">Todas</option>
            {CATEGORIA_ORDER.map((c) => (
              <option key={c} value={c}>
                {CATEGORIA_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Nicho</label>
          <select name="nicho" defaultValue={searchParams.nicho} className="input">
            <option value="">Todos</option>
            {nichos.map(
              (n) =>
                n.nicho && (
                  <option key={n.nicho} value={n.nicho}>
                    {n.nicho}
                  </option>
                )
            )}
          </select>
        </div>
        <div>
          <label className="label">Responsável</label>
          <select
            name="responsavel"
            defaultValue={searchParams.responsavel}
            className="input"
          >
            <option value="">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
          <button type="submit" className="btn-primary">
            Filtrar
          </button>
          <Link href="/clientes" className="btn-secondary">
            Limpar
          </Link>
        </div>
      </form>

      {clients.length === 0 ? (
        <div className="card p-10 text-center text-text-secondary">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <ClientBulkTable
          users={users}
          stages={stages}
          clients={clients.map((c) => ({
            id: c.id,
            nomeRazaoSocial: c.nomeRazaoSocial,
            categoria: c.categoria,
            tipoRelacao: c.tipoRelacao,
            nicho: c.nicho,
            servicos: c.servicos.map((s) => s.service.nome),
            responsavelNome: c.responsavel?.nome ?? null,
            partnerAgencyNome: c.partnerAgency?.nome ?? null,
            valorMensal: c.valorMensal ? Number(c.valorMensal) : null,
            stageNome: c.stage?.nome ?? null,
            stageCor: c.stage?.cor ?? null,
          }))}
        />
      )}
    </div>
  );
}
