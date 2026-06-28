import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteClient, deleteNote } from "@/lib/actions/clients";
import { waLink } from "@/lib/whatsapp";
import { getDemandasDoCliente } from "@/lib/todoist";
import { MetaMetrics } from "@/components/meta-metrics";
import type { MetaPeriodo } from "@/lib/meta";
import { NoteForm } from "@/components/note-form";
import { DeleteButton } from "@/components/delete-button";
import { StatusSelect } from "@/components/status-select";
import {
  STATUS_BADGE,
  STATUS_LABELS,
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
      <dt className="text-xs uppercase tracking-wide text-text-muted">{label}</dt>
      <dd className="text-sm text-text-primary">{value || "—"}</dd>
    </div>
  );
}

export default async function ClienteDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { meta?: string };
}) {
  const metaPeriodo: MetaPeriodo =
    searchParams.meta === "last_30d" || searchParams.meta === "last_7d"
      ? searchParams.meta
      : "this_month";
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    include: {
      partnerAgency: true,
      responsavel: { select: { nome: true } },
      servicos: { include: { service: true } },
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

  // Demandas pendentes do cliente no Todoist (null = integração off/erro).
  const demandas = await getDemandasDoCliente(client.nomeRazaoSocial);

  const deleteAction = deleteClient.bind(null, client.id);

  const whatsappNumero = client.contatos.find(
    (c) => c.tipo === "WHATSAPP"
  )?.valor;
  const whatsappHref = waLink(
    whatsappNumero,
    "Olá! 😊 Aqui é da Focus Digital. Tudo bem?"
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/clientes"
            className="text-sm text-accent-primary hover:underline"
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
          <p className="text-sm text-text-secondary">
            {TIPO_RELACAO_LABELS[client.tipoRelacao]}
            {client.partnerAgency && (
              <>
                {" · via "}
                <Link
                  href={`/agencias/${client.partnerAgency.id}`}
                  className="text-accent-primary hover:underline"
                >
                  {client.partnerAgency.nome}
                </Link>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-current"
                aria-hidden="true"
              >
                <path d="M17.5 14.4c-.3-.1-1.7-.8-1.9-.9-.3-.1-.5-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-1.5-.7-2.5-1.3-3.5-3-.3-.5.3-.4.8-1.4.1-.2 0-.4 0-.5 0-.1-.6-1.5-.9-2-.2-.5-.4-.4-.6-.5h-.5c-.2 0-.5.1-.7.3-.3.3-1 1-1 2.4s1 2.8 1.2 3c.1.2 2 3.1 5 4.3 1.9.7 2.6.8 3.5.7.6-.1 1.7-.7 1.9-1.4.2-.6.2-1.2.2-1.3-.1-.2-.3-.2-.6-.3z" />
                <path d="M12 2a10 10 0 0 0-8.5 15.3L2 22l4.8-1.5A10 10 0 1 0 12 2zm0 18a8 8 0 0 1-4.1-1.1l-.3-.2-2.9.9.9-2.8-.2-.3A8 8 0 1 1 12 20z" />
              </svg>
              WhatsApp
            </a>
          )}
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
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
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
                value={
                  <span className="sensivel">
                    {formatCurrency(
                      client.valorMensal ? Number(client.valorMensal) : null
                    )}
                  </span>
                }
              />
              <Field
                label="Custo mensal"
                value={
                  <span className="sensivel">
                    {formatCurrency(
                      client.custoMensal ? Number(client.custoMensal) : null
                    )}
                  </span>
                }
              />
              <Field
                label="Dia de vencimento"
                value={client.diaVencimento ? `Dia ${client.diaVencimento}` : null}
              />
              <Field
                label="Hospedagem"
                value={
                  client.possuiHospedagem ? (
                    client.dataRenovacao ? (
                      <>
                        Sim · renova {formatDate(client.dataRenovacao)}
                        {client.valorRenovacao ? (
                          <>
                            {" · "}
                            <span className="sensivel">
                              {formatCurrency(Number(client.valorRenovacao))}/ano
                            </span>
                          </>
                        ) : null}
                      </>
                    ) : (
                      "Sim"
                    )
                  ) : (
                    "Não"
                  )
                }
              />
              <Field
                label="Serviços"
                value={
                  client.servicos.length
                    ? client.servicos.map((s) => s.service.nome).join(", ")
                    : "—"
                }
              />
            </dl>

            {client.contatos.length > 0 && (
              <div className="mt-4 border-t border-border-subtle pt-4">
                <h3 className="mb-2 text-xs uppercase tracking-wide text-text-muted">
                  Contatos
                </h3>
                <ul className="space-y-1 text-sm">
                  {client.contatos.map((c) => (
                    <li key={c.id}>
                      <span className="text-text-secondary">
                        {TIPO_CONTATO_LABELS[c.tipo]}:
                      </span>{" "}
                      {c.valor}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {client.observacoes && (
              <div className="mt-4 border-t border-border-subtle pt-4">
                <h3 className="mb-2 text-xs uppercase tracking-wide text-text-muted">
                  Observações
                </h3>
                <p className="whitespace-pre-wrap text-sm text-text-primary">
                  {client.observacoes}
                </p>
              </div>
            )}
          </section>

          {/* Métricas do Meta (se a conta de anúncio estiver vinculada) */}
          {client.metaAdAccountId && (
            <MetaMetrics
              clientId={client.id}
              adAccountId={client.metaAdAccountId}
              periodo={metaPeriodo}
            />
          )}

          {/* Diário de interações */}
          <section className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Diário de interações
            </h2>
            <NoteForm clientId={client.id} />

            <ul className="mt-6 space-y-4">
              {client.notas.length === 0 && (
                <li className="text-sm text-text-muted">
                  Nenhuma anotação ainda.
                </li>
              )}
              {client.notas.map((nota) => {
                const del = deleteNote.bind(null, nota.id, client.id);
                return (
                  <li
                    key={nota.id}
                    className="border-l-2 border-accent-subtle-border pl-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-text-muted">
                        {formatDateTime(nota.criadoEm)}
                        {nota.autor?.nome && ` · ${nota.autor.nome}`}
                      </span>
                      <DeleteButton
                        action={del}
                        label="Remover"
                        confirmMessage="Remover esta anotação?"
                      />
                    </div>
                    <p className="whitespace-pre-wrap text-sm text-text-primary">
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
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Status atual
            </h2>
            <StatusSelect clientId={client.id} current={client.status} />
          </section>

          {demandas !== null && (
            <section className="card p-6">
              <h2 className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-text-secondary">
                Tarefas (Todoist)
                <span className="text-xs font-normal text-text-muted">
                  {demandas.length} pendente(s)
                </span>
              </h2>
              {demandas.length === 0 ? (
                <p className="text-sm text-text-muted">
                  Nenhuma demanda pendente.
                </p>
              ) : (
                <ul className="space-y-2">
                  {demandas.map((d) => (
                    <li key={d.id} className="flex items-start gap-2 text-sm">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-primary" />
                      <div className="min-w-0">
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-text-primary hover:underline"
                        >
                          {d.titulo}
                        </a>
                        {d.vencimentoLabel && (
                          <span
                            className={`ml-2 text-xs ${
                              d.emDias !== null && d.emDias < 0
                                ? "font-medium text-status-error"
                                : d.emDias === 0
                                  ? "font-medium text-status-warning"
                                  : "text-text-muted"
                            }`}
                          >
                            {d.vencimentoLabel}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
              Histórico de status
            </h2>
            <ol className="space-y-4">
              {client.statusHistory.map((h) => (
                <li key={h.id} className="flex gap-3">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent-primary" />
                  <div>
                    <p className="text-sm text-text-primary">
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
                    <p className="text-xs text-text-muted">
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
