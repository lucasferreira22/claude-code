import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { markHostingRenewed } from "@/lib/actions/hosting";
import { waLink, hospedagemMessage } from "@/lib/whatsapp";
import {
  CATEGORIA_BADGE,
  CATEGORIA_LABELS,
  formatCurrency,
  formatDate,
} from "@/lib/labels";

// Dias entre hoje e a data (negativo = já venceu). null se não há data.
function diasPara(data: Date | null, hoje: Date): number | null {
  if (!data) return null;
  const MS = 24 * 60 * 60 * 1000;
  const a = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const b = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  return Math.round((b.getTime() - a.getTime()) / MS);
}

export default async function HospedagensPage() {
  const hoje = new Date();

  const clientes = await prisma.client.findMany({
    where: { possuiHospedagem: true },
    select: {
      id: true,
      nomeRazaoSocial: true,
      categoria: true,
      valorRenovacao: true,
      dataRenovacao: true,
      contatos: {
        where: { tipo: "WHATSAPP" },
        select: { valor: true },
        take: 1,
      },
    },
    orderBy: { dataRenovacao: { sort: "asc", nulls: "last" } },
  });

  const valorAnualTotal = clientes.reduce(
    (s, c) => s + (c.valorRenovacao ? Number(c.valorRenovacao) : 0),
    0
  );
  const proximos30 = clientes.filter((c) => {
    const d = diasPara(c.dataRenovacao, hoje);
    return d !== null && d >= 0 && d <= 30;
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Hospedagens</h1>
        <p className="text-sm text-text-secondary">
          Renovações anuais de hospedagem e domínio — de todos os clientes.
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Clientes com hospedagem
          </p>
          <p className="mt-1 text-2xl font-bold">{clientes.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Receita anual (renovações)
          </p>
          <p className="sensivel mt-1 text-2xl font-bold">
            {formatCurrency(valorAnualTotal)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Renovam nos próximos 30 dias
          </p>
          <p className="mt-1 text-2xl font-bold text-status-warning">{proximos30}</p>
        </div>
      </div>

      {clientes.length === 0 ? (
        <div className="card p-10 text-center text-text-secondary">
          Nenhum cliente com hospedagem. Marque a opção{" "}
          <span className="font-medium">
            &quot;Este cliente tem hospedagem&quot;
          </span>{" "}
          no cadastro para que ele apareça aqui.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border-default bg-surface-elevated text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Valor anual</th>
                <th className="px-4 py-3">Próxima renovação</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {clientes.map((c) => {
                const dias = diasPara(c.dataRenovacao, hoje);
                const renovar = markHostingRenewed.bind(null, c.id);
                const whatsappHref = waLink(
                  c.contatos[0]?.valor,
                  hospedagemMessage({
                    valorLabel: c.valorRenovacao
                      ? formatCurrency(Number(c.valorRenovacao))
                      : null,
                    dataLabel: c.dataRenovacao ? formatDate(c.dataRenovacao) : null,
                  })
                );
                return (
                  <tr key={c.id} className="hover:bg-surface-elevated">
                    <td className="px-4 py-3">
                      <Link
                        href={`/clientes/${c.id}`}
                        className="font-medium text-accent-primary hover:underline"
                      >
                        {c.nomeRazaoSocial}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${CATEGORIA_BADGE[c.categoria]}`}>
                        {CATEGORIA_LABELS[c.categoria]}
                      </span>
                    </td>
                    <td className="sensivel px-4 py-3 text-right text-text-primary">
                      {c.valorRenovacao
                        ? formatCurrency(Number(c.valorRenovacao))
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {c.dataRenovacao ? (
                        <span className="flex items-center gap-2">
                          <span className="text-text-primary">
                            {formatDate(c.dataRenovacao)}
                          </span>
                          {dias !== null && (
                            <span
                              className={`badge ${
                                dias < 0
                                  ? "badge-danger"
                                  : dias <= 30
                                    ? "badge-warning"
                                    : "bg-surface-elevated text-text-secondary"
                              }`}
                            >
                              {dias < 0
                                ? `vencida há ${Math.abs(dias)}d`
                                : dias === 0
                                  ? "hoje"
                                  : `em ${dias}d`}
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-text-muted">Sem data</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {whatsappHref && (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Avisar renovação no WhatsApp"
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
                            Avisar
                          </a>
                        )}
                        <form action={renovar}>
                          <button type="submit" className="btn-secondary">
                            Marcar renovado
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
