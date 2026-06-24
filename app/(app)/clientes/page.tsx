import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type {
  Categoria,
  ClientStatus,
  Prisma,
  TipoRelacao,
} from "@prisma/client";
import {
  STATUS_BADGE,
  STATUS_LABELS,
  STATUS_ORDER,
  SERVICO_LABELS,
  TIPO_RELACAO_LABELS,
  CATEGORIA_LABELS,
  CATEGORIA_ORDER,
  CATEGORIA_BADGE,
  formatCurrency,
} from "@/lib/labels";

type SearchParams = {
  q?: string;
  tipo?: string;
  status?: string;
  categoria?: string;
  nicho?: string;
  responsavel?: string;
};

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const where: Prisma.ClientWhereInput = {};

  if (searchParams.q) {
    where.nomeRazaoSocial = { contains: searchParams.q, mode: "insensitive" };
  }
  if (searchParams.tipo === "DIRETO" || searchParams.tipo === "PARCERIA") {
    where.tipoRelacao = searchParams.tipo as TipoRelacao;
  }
  if (
    searchParams.status &&
    STATUS_ORDER.includes(searchParams.status as ClientStatus)
  ) {
    where.status = searchParams.status as ClientStatus;
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
        partnerAgency: { select: { nome: true } },
        responsavel: { select: { nome: true } },
        servicos: true,
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
          <p className="text-sm text-gray-500">
            {clients.length} de {total} cliente(s)
          </p>
        </div>
        <Link href="/clientes/novo" className="btn-primary">
          + Novo cliente
        </Link>
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
          <label className="label">Status</label>
          <select name="status" defaultValue={searchParams.status} className="input">
            <option value="">Todos</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
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
        <div className="card p-10 text-center text-gray-500">
          Nenhum cliente encontrado.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Nicho</th>
                <th className="px-4 py-3">Serviços</th>
                <th className="px-4 py-3">Responsável</th>
                <th className="px-4 py-3">Valor mensal</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {clients.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {c.nomeRazaoSocial}
                    </Link>
                    {c.partnerAgency && (
                      <div className="text-xs text-gray-400">
                        via {c.partnerAgency.nome}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${CATEGORIA_BADGE[c.categoria]}`}>
                      {CATEGORIA_LABELS[c.categoria]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {TIPO_RELACAO_LABELS[c.tipoRelacao]}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.nicho ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.servicos.length === 0
                      ? "—"
                      : c.servicos
                          .map((s) => SERVICO_LABELS[s.servico])
                          .join(", ")}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {c.responsavel?.nome ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatCurrency(c.valorMensal ? Number(c.valorMensal) : null)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_BADGE[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
