import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { setCustomChargeStatus } from "@/lib/actions/custom-charges";
import { CustomChargeForm } from "@/components/custom-charge-form";
import { ChargeCategoryActions } from "@/components/charge-category-actions";
import { DeleteChargeButton } from "@/components/delete-charge-button";
import { venceEm, diaVencimentoDe } from "@/lib/custom-charges";
import { waLink, cobrancaAvulsaMessage } from "@/lib/whatsapp";
import {
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_ATRASADO_BADGE,
  RECORRENCIA_LABELS,
  formatCurrency,
  currentCompetencia,
  formatCompetencia,
  competenciaOptions,
} from "@/lib/labels";

type SearchParams = { mes?: string };

// Uma cobrança PENDENTE está atrasada se a competência já passou, ou se é o mês
// corrente e o dia de vencimento já passou.
function estaAtrasada(
  competencia: string,
  diaVencimento: number,
  hoje: Date
): boolean {
  const atual = currentCompetencia(hoje);
  if (competencia < atual) return true;
  if (competencia === atual) return hoje.getDate() > diaVencimento;
  return false;
}

export default async function CategoriaAvulsaPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: SearchParams;
}) {
  const categoria = await prisma.chargeCategory.findUnique({
    where: { id: params.id },
  });
  if (!categoria) notFound();

  const competencia =
    searchParams.mes && /^\d{4}-\d{2}$/.test(searchParams.mes)
      ? searchParams.mes
      : currentCompetencia();
  const hoje = new Date();
  const opcoes = competenciaOptions();

  const [charges, clientes] = await Promise.all([
    prisma.customCharge.findMany({
      where: { categoryId: categoria.id, ativo: true },
      include: {
        client: {
          select: {
            id: true,
            nomeRazaoSocial: true,
            contatos: {
              where: { tipo: "WHATSAPP" },
              select: { valor: true },
              take: 1,
            },
          },
        },
        pagamentos: { where: { competencia }, take: 1 },
      },
      orderBy: { client: { nomeRazaoSocial: "asc" } },
    }),
    prisma.client.findMany({
      select: { id: true, nomeRazaoSocial: true },
      orderBy: { nomeRazaoSocial: "asc" },
    }),
  ]);

  // Só as cobranças que vencem na competência selecionada.
  const doMes = charges
    .filter((c) => venceEm(c, competencia))
    .map((c) => {
      const status = c.pagamentos[0]?.status ?? "PENDENTE";
      const dia = diaVencimentoDe(c);
      const atrasada =
        status === "PENDENTE" && estaAtrasada(competencia, dia, hoje);
      return { c, status, dia, atrasada };
    });

  const total = doMes.reduce((s, r) => s + Number(r.c.valor), 0);
  const recebido = doMes
    .filter((r) => r.status === "PAGO")
    .reduce((s, r) => s + Number(r.c.valor), 0);
  const pendente = total - recebido;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{categoria.nome}</h1>
          <p className="text-sm text-text-secondary">
            Cobranças avulsas · {formatCompetencia(competencia)}
          </p>
        </div>
        <div className="flex items-end gap-3">
          <form method="GET" className="flex items-end gap-2">
            <div>
              <label className="label">Mês (competência)</label>
              <select name="mes" defaultValue={competencia} className="input">
                {opcoes.map((c) => (
                  <option key={c} value={c}>
                    {formatCompetencia(c)}
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="btn-secondary">
              Ver
            </button>
          </form>
          <ChargeCategoryActions id={categoria.id} nome={categoria.nome} />
        </div>
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            A receber (mês)
          </p>
          <p className="sensivel mt-1 text-2xl font-bold">
            {formatCurrency(total)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Recebido
          </p>
          <p className="sensivel mt-1 text-2xl font-bold text-status-success">
            {formatCurrency(recebido)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Pendente
          </p>
          <p className="sensivel mt-1 text-2xl font-bold text-status-warning">
            {formatCurrency(pendente)}
          </p>
        </div>
      </div>

      <CustomChargeForm categoryId={categoria.id} clientes={clientes} />

      {doMes.length === 0 ? (
        <div className="card p-10 text-center text-text-secondary">
          Nenhuma cobrança vencendo em {formatCompetencia(competencia)}. Use{" "}
          <span className="font-medium">&quot;Nova cobrança&quot;</span> para
          adicionar, ou troque o mês.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border-default bg-surface-elevated text-left text-xs uppercase tracking-wide text-text-secondary">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Descrição</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {doMes.map(({ c, status, dia, atrasada }) => {
                const marcar = setCustomChargeStatus.bind(
                  null,
                  c.id,
                  competencia,
                  status === "PAGO" ? "PENDENTE" : "PAGO"
                );
                const descricao = c.descricao ?? categoria.nome;
                const whatsappHref =
                  status === "PENDENTE"
                    ? waLink(
                        c.client.contatos[0]?.valor,
                        cobrancaAvulsaMessage({
                          descricao,
                          valorLabel: formatCurrency(Number(c.valor)),
                          vencimentoLabel: `${formatCompetencia(competencia)} (dia ${dia})`,
                          atrasada,
                        })
                      )
                    : null;
                return (
                  <tr key={c.id} className="hover:bg-surface-elevated">
                    <td className="px-4 py-3">
                      <Link
                        href={`/clientes/${c.client.id}`}
                        className="font-medium text-accent-primary hover:underline"
                      >
                        {c.client.nomeRazaoSocial}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {c.descricao ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {c.tipo === "RECORRENTE" && c.recorrencia
                        ? RECORRENCIA_LABELS[c.recorrencia]
                        : "Pontual"}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      Dia {dia}
                    </td>
                    <td className="sensivel px-4 py-3 text-right text-text-primary">
                      {formatCurrency(Number(c.valor))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          atrasada
                            ? PAYMENT_ATRASADO_BADGE
                            : PAYMENT_STATUS_BADGE[status]
                        }`}
                      >
                        {atrasada ? "Atrasado" : PAYMENT_STATUS_LABELS[status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {whatsappHref && (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar lembrete no WhatsApp"
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
                            Lembrar
                          </a>
                        )}
                        <form action={marcar}>
                          <button
                            type="submit"
                            className={
                              status === "PAGO" ? "btn-secondary" : "btn-primary"
                            }
                          >
                            {status === "PAGO" ? "Desfazer" : "Marcar pago"}
                          </button>
                        </form>
                        <DeleteChargeButton id={c.id} />
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
