import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  summarize,
  hospedagemMensal,
  num,
  type FinanceClient,
} from "@/lib/finance";
import { faturamentoAvulsasDoMes } from "@/lib/custom-charges";
import {
  CATEGORIA_LABELS,
  CATEGORIA_ORDER,
  CATEGORIA_BADGE,
  formatCurrency,
} from "@/lib/labels";

const financeSelect = {
  id: true,
  nomeRazaoSocial: true,
  categoria: true,
  stageId: true,
  stage: { select: { contaComoAtivo: true } },
  tipoRelacao: true,
  valorMensal: true,
  custoMensal: true,
  diaVencimento: true,
  dataRenovacao: true,
  valorRenovacao: true,
} as const;

export default async function FinanceiroPage() {
  const [rows, avulsas] = await Promise.all([
    prisma.client.findMany({
      select: financeSelect,
      orderBy: { valorMensal: "desc" },
    }),
    prisma.customCharge.findMany({
      where: { ativo: true },
      select: {
        valor: true,
        tipo: true,
        recorrencia: true,
        primeiroVencimento: true,
        ativo: true,
      },
    }),
  ]);
  const clients: FinanceClient[] = rows.map((r) => ({
    ...r,
    contaComoAtivo: r.stage?.contaComoAtivo ?? false,
  }));

  const resumo = summarize(clients);
  // Cobranças avulsas (pontuais + recorrentes) que vencem no mês atual entram
  // no faturamento pelo valor cheio.
  const avulsasMes = faturamentoAvulsasDoMes(avulsas);
  const faturamentoMensal = resumo.faturamentoMensal + avulsasMes;
  const lucro = faturamentoMensal - resumo.custoMensal;

  // Detalhamento por cliente (ativos com algum faturamento mensal).
  // valor = mensalidade + hospedagem rateada (÷12).
  const ativos = clients
    .map((c) => {
      const valor = (num(c.valorMensal) ?? 0) + hospedagemMensal(c);
      const custo = num(c.custoMensal) ?? 0;
      return { c, valor, custo, lucro: valor - custo };
    })
    .filter((r) => r.c.contaComoAtivo && r.valor > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-text-secondary">
          Faturamento, custos e lucro dos clientes ativos.
        </p>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Faturamento mensal
          </p>
          <p className="sensivel mt-1 text-2xl font-bold">
            {formatCurrency(faturamentoMensal)}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            Inclui hospedagem diluída (÷12) e cobranças avulsas do mês
            {avulsasMes > 0 ? ` (${formatCurrency(avulsasMes)})` : ""}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">Custo</p>
          <p className="sensivel mt-1 text-2xl font-bold">
            {formatCurrency(resumo.custoMensal)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-text-muted">Lucro</p>
          <p
            className={`sensivel mt-1 text-2xl font-bold ${
              lucro >= 0 ? "text-status-success" : "text-status-error"
            }`}
          >
            {formatCurrency(lucro)}
          </p>
        </div>
      </div>

      {/* Por categoria */}
      <section className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Faturamento por categoria
        </h2>
        <ul className="space-y-2">
          {CATEGORIA_ORDER.map((cat) => (
            <li
              key={cat}
              className="flex items-center justify-between text-sm"
            >
              <span className={`badge ${CATEGORIA_BADGE[cat]}`}>
                {CATEGORIA_LABELS[cat]}
                <span className="ml-1 text-text-secondary">
                  ({resumo.porCategoria[cat].count})
                </span>
              </span>
              <span className="sensivel font-medium text-text-primary">
                {formatCurrency(resumo.porCategoria[cat].faturamento)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Por cliente */}
      <section className="card overflow-x-auto">
        <h2 className="px-6 pt-6 text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Detalhamento por cliente (ativos)
        </h2>
        <table className="mt-4 w-full text-sm">
          <thead className="border-b border-border-default bg-surface-elevated text-left text-xs uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Custo</th>
              <th className="px-4 py-3 text-right">Lucro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {ativos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-text-muted">
                  Nenhum cliente ativo com valor mensal.
                </td>
              </tr>
            ) : (
              ativos.map(({ c, valor, custo, lucro }) => (
                <tr key={c.id} className="hover:bg-surface-elevated">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium text-accent-primary hover:underline"
                    >
                      {c.nomeRazaoSocial}
                    </Link>
                  </td>
                  <td className="sensivel px-4 py-3 text-right text-text-secondary">
                    {formatCurrency(valor)}
                  </td>
                  <td className="sensivel px-4 py-3 text-right text-text-secondary">
                    {custo > 0 ? formatCurrency(custo) : "—"}
                  </td>
                  <td
                    className={`sensivel px-4 py-3 text-right font-medium ${
                      lucro >= 0 ? "text-status-success" : "text-status-error"
                    }`}
                  >
                    {formatCurrency(lucro)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
