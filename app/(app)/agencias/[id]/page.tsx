import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteAgency } from "@/lib/actions/agencies";
import { DeleteButton } from "@/components/delete-button";
import {
  STATUS_BADGE,
  STATUS_LABELS,
  formatCurrency,
} from "@/lib/labels";

export default async function AgenciaDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const agency = await prisma.partnerAgency.findUnique({
    where: { id: params.id },
    include: {
      clientes: {
        orderBy: { nomeRazaoSocial: "asc" },
        select: {
          id: true,
          nomeRazaoSocial: true,
          nicho: true,
          status: true,
          valorMensal: true,
        },
      },
    },
  });

  if (!agency) notFound();

  const deleteAction = deleteAgency.bind(null, agency.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/agencias" className="text-sm text-accent-primary hover:underline">
            ← Voltar para agências
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{agency.nome}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/agencias/${agency.id}/editar`}
            className="btn-secondary"
          >
            Editar
          </Link>
          <DeleteButton
            action={deleteAction}
            confirmMessage={
              agency.clientes.length > 0
                ? `Esta agência tem ${agency.clientes.length} cliente(s) vinculado(s). Eles ficarão sem agência. Excluir mesmo assim?`
                : `Excluir a agência "${agency.nome}"?`
            }
          />
        </div>
      </div>

      <section className="card grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-text-muted">
            Contato
          </dt>
          <dd className="text-sm text-text-primary">{agency.contatoNome ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-text-muted">
            E-mail
          </dt>
          <dd className="text-sm text-text-primary">{agency.contatoEmail ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-text-muted">
            Telefone
          </dt>
          <dd className="text-sm text-text-primary">
            {agency.contatoTelefone ?? "—"}
          </dd>
        </div>
        {agency.observacoes && (
          <div className="col-span-2 sm:col-span-4">
            <dt className="text-xs uppercase tracking-wide text-text-muted">
              Observações
            </dt>
            <dd className="whitespace-pre-wrap text-sm text-text-primary">
              {agency.observacoes}
            </dd>
          </div>
        )}
      </section>

      <section className="card">
        <div className="border-b border-border-subtle px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
            Clientes desta agência ({agency.clientes.length})
          </h2>
        </div>
        {agency.clientes.length === 0 ? (
          <p className="p-6 text-sm text-text-muted">
            Nenhum cliente vinculado a esta agência.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-elevated text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Nicho</th>
                <th className="px-6 py-3">Valor mensal</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {agency.clientes.map((c) => (
                <tr key={c.id} className="hover:bg-surface-elevated">
                  <td className="px-6 py-3">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium text-accent-primary hover:underline"
                    >
                      {c.nomeRazaoSocial}
                    </Link>
                  </td>
                  <td className="px-6 py-3 text-text-secondary">{c.nicho ?? "—"}</td>
                  <td className="px-6 py-3 text-text-secondary">
                    {formatCurrency(
                      c.valorMensal ? Number(c.valorMensal) : null
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <span className={`badge ${STATUS_BADGE[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
