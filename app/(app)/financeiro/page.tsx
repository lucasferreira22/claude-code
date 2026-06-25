import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { summarize, num, type FinanceClient } from "@/lib/finance";
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
  status: true,
  tipoRelacao: true,
  valorMensal: true,
  custoMensal: true,
  diaVencimento: true,
  dataRenovacao: true,
  valorRenovacao: true,
} as const;

export default async function FinanceiroPage() {
  const rows = await prisma.client.findMany({
    select: financeSelect,
    orderBy: { valorMensal: "desc" },
  });
  const clients = rows as unknown as FinanceClient[];

  const resumo = summarize(clients);

  // Detalhamento por cliente (somente ativos com algum valor)
  const ativos = clients
    .filter((c) => c.status === "ATIVO" && (num(c.valorMensal) ?? 0) > 0)
    .map((c) => {
      const valor = num(c.valorMensal) ?? 0;
      const custo = num(c.custoMensal) ?? 0;
      return { c, valor, custo, lucro: valor - custo };
    });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <p className="text-sm text-gray-500">
          Faturamento, custos, comissões e lucro dos clientes ativos.
        </p>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Faturamento
          </p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(resumo.faturamentoMensal)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Custo</p>
          <p className="mt-1 text-2xl font-bold">
            {formatCurrency(resumo.custoMensal)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">Lucro</p>
          <p
            className={`mt-1 text-2xl font-bold ${
              resumo.lucro >= 0 ? "text-green-700" : "text-red-700"
            }`}
          >
            {formatCurrency(resumo.lucro)}
          </p>
        </div>
      </div>

      {/* Por categoria */}
      <section className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
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
                <span className="ml-1 text-gray-500">
                  ({resumo.porCategoria[cat].count})
                </span>
              </span>
              <span className="font-medium text-gray-700">
                {formatCurrency(resumo.porCategoria[cat].faturamento)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Por cliente */}
      <section className="card overflow-x-auto">
        <h2 className="px-6 pt-6 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Detalhamento por cliente (ativos)
        </h2>
        <table className="mt-4 w-full text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3 text-right">Valor</th>
              <th className="px-4 py-3 text-right">Custo</th>
              <th className="px-4 py-3 text-right">Lucro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ativos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Nenhum cliente ativo com valor mensal.
                </td>
              </tr>
            ) : (
              ativos.map(({ c, valor, custo, lucro }) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      {c.nomeRazaoSocial}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {formatCurrency(valor)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {custo > 0 ? formatCurrency(custo) : "—"}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      lucro >= 0 ? "text-green-700" : "text-red-700"
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
