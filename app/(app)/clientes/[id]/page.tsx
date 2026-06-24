import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteClient, deleteNote } from "@/lib/actions/clients";
import { NoteForm } from "@/components/note-form";
import { DeleteButton } from "@/components/delete-button";
import { StatusSelect } from "@/components/status-select";
import {
  STATUS_BADGE,
  STATUS_LABELS,
  SERVICO_LABELS,
  TIPO_CONTATO_LABELS,
  TIPO_RELACAO_LABELS,
  CATEGORIA_LABELS,
  CATEGORIA_BADGE,
  formatCurrency,
  formatDate,
  formatDateTime,
} from "@/lib/labels";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-800">{value || "—"}</dd>
    </div>
  );
}

export default async function ClienteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      partnerAgency: true,
      responsavel: { select: { nome: true } },
      servicos: true,
      contatos: true,
      notas: {
        include: { autor: { select: { nome: true } } },
        orderBy: { criadoEm: "desc" },
      },
      statusHistory: {
        include: { alteradoPor: { select: { nome: true } } },
        orderBy: { dataMudanca: "desc" },
      },
    },
  });

  if (!client) notFound();

  const deleteAction = deleteClient.bind(null, client.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/clientes"
            className="text-sm text-brand-700 hover:underline"
          >
            ← Voltar para clientes
          </Link>
          <h1 className="mt-1 flex items-center gap-3 text-2xl font-bold">
            {client.nomeRazaoSocial}
            <span className={`badge ${STATUS_BADGE[client.status]}`}>
              {STATUS_LABELS[client.status]}
            </span>
            <span className={`badge ${CATEGORIA_BADGE[client.categoria]}`}>
              {CATEGORIA_LABELS[client.categoria]}
            </span>
          </h1>
          <p className="text-sm text-gray-500">
            {TIPO_RELACAO_LABELS[client.tipoRelacao]}
            {client.partnerAgency && (
              <>
                {" · via "}
                <Link
                  href={`/agencias/${client.partnerAgency.id}`}
                  className="text-brand-700 hover:underline"
                >
                  {client.partnerAgency.nome}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/clientes/${client.id}/editar`} className="btn-secondary">
            Editar
          </Link>
          <DeleteButton
            action={deleteAction}
            confirmMessage={`Excluir o cliente "${client.nomeRazaoSocial}"? Esta ação não pode ser desfeita.`}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Dados cadastrais */}
          <section className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Dados cadastrais
            </h2>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Nicho" value={client.nicho} />
              <Field
                label="Cidade / UF"
                value={[client.cidade, client.estado].filter(Boolean).join(" / ")}
              />
              <Field label="CNPJ" value={client.cnpj} />
              <Field label="Responsável" value={client.responsavel?.nome} />
              <Field
                label="Início do contrato"
                value={formatDate(client.dataInicioContrato)}
              />
              <Field
                label="Fim do contrato"
                value={formatDate(client.dataFimContrato)}
              />
              <Field
                label="Valor mensal"
                value={formatCurrency(
                  client.valorMensal ? Number(client.valorMensal) : null
                )}
              />
              <Field
                label="Custo mensal"
                value={formatCurrency(
                  client.custoMensal ? Number(client.custoMensal) : null
                )}
              />
              <Field
                label="Dia de vencimento"
                value={client.diaVencimento ? `Dia ${client.diaVencimento}` : null}
              />
              <Field
                label="Renovação (hosp.)"
                value={
                  client.dataRenovacao
                    ? `${formatDate(client.dataRenovacao)}${
                        client.valorRenovacao
                          ? ` · ${formatCurrency(Number(client.valorRenovacao))}`
                          : ""
                      }`
                    : null
                }
              />
              <Field
                label="Serviços"
                value={
                  client.servicos.length
                    ? client.servicos
                        .map((s) => SERVICO_LABELS[s.servico])
                        .join(", ")
                    : "—"
                }
              />
            </dl>

            {client.contatos.length > 0 && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="mb-2 text-xs uppercase tracking-wide text-gray-400">
                  Contatos
                </h3>
                <ul className="space-y-1 text-sm">
                  {client.contatos.map((c) => (
                    <li key={c.id}>
                      <span className="text-gray-500">
                        {TIPO_CONTATO_LABELS[c.tipo]}:
                      </span>{" "}
                      {c.valor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {client.observacoes && (
              <div className="mt-4 border-t border-gray-100 pt-4">
                <h3 className="mb-2 text-xs uppercase tracking-wide text-gray-400">
                  Observações
                </h3>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {client.observacoes}
                </p>
              </div>
            )}
          </section>

          {/* Diário de interações */}
          <section className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Diário de interações
            </h2>
            <NoteForm clientId={client.id} />

            <ul className="mt-6 space-y-4">
              {client.notas.length === 0 && (
                <li className="text-sm text-gray-400">
                  Nenhuma anotação ainda.
                </li>
              )}
              {client.notas.map((nota) => {
                const del = deleteNote.bind(null, nota.id, client.id);
                return (
                  <li
                    key={nota.id}
                    className="border-l-2 border-brand-100 pl-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {formatDateTime(nota.criadoEm)}
                        {nota.autor?.nome && ` · ${nota.autor.nome}`}
                      </span>
                      <DeleteButton
                        action={del}
                        label="Remover"
                        confirmMessage="Remover esta anotação?"
                      />
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-gray-800">
                      {nota.conteudo}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-6">
          <section className="card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Status atual
            </h2>
            <StatusSelect clientId={client.id} current={client.status} />
          </section>

          <section className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Histórico de status
            </h2>
            <ol className="space-y-4">
              {client.statusHistory.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                  <div>
                    <p className="text-sm text-gray-800">
                      {h.statusAnterior ? (
                        <>
                          {STATUS_LABELS[h.statusAnterior]} →{" "}
                          <span className="font-medium">
                            {STATUS_LABELS[h.statusNovo]}
                          </span>
                        </>
                      ) : (
                        <>
                          Cadastrado como{" "}
                          <span className="font-medium">
                            {STATUS_LABELS[h.statusNovo]}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateTime(h.dataMudanca)}
                      {h.alteradoPor?.nome && ` · ${h.alteradoPor.nome}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
