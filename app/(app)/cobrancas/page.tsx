import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  generateMonthlyPayments,
  setPaymentStatus,
} from "@/lib/actions/payments";
import {
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_ATRASADO_BADGE,
  formatCurrency,
  currentCompetencia,
  formatCompetencia,
  competenciaOptions,
} from "@/lib/labels";

type SearchParams = { mes?: string };

// Uma cobrança PENDENTE está atrasada se a competência já passou, ou se é o mês
// corrente e o dia de vencimento do cliente já passou.
function estaAtrasada(
  competencia: string,
  diaVencimento: number | null,
  hoje: Date
): boolean {
  const atual = currentCompetencia(hoje);
  if (competencia < atual) return true;
  if (competencia === atual && diaVencimento)
    return hoje.getDate() > diaVencimento;
  return false;
}

export default async function CobrancasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const opcoes = competenciaOptions();
  const competencia =
    searchParams.mes && /^\d{4}-\d{2}$/.test(searchParams.mes)
      ? searchParams.mes
      : currentCompetencia();
  const hoje = new Date();

  const pagamentos = await prisma.payment.findMany({
    where: { competencia },
    include: {
      client: {
        select: { id: true, nomeRazaoSocial: true, diaVencimento: true },
      },
    },
    orderBy: { client: { nomeRazaoSocial: "asc" } },
  });

  const recebido = pagamentos
    .filter((p) => p.status === "PAGO")
    .reduce((s, p) => s + Number(p.valor), 0);
  const pendente = pagamentos
    .filter((p) => p.status === "PENDENTE")
    .reduce((s, p) => s + Number(p.valor), 0);
  const total = recebido + pendente;
  const atrasados = pagamentos.filter(
    (p) =>
      p.status === "PENDENTE" &&
      estaAtrasada(competencia, p.client.diaVencimento, hoje)
  ).length;

  // Server action inline: gera as cobranças do mês selecionado.
  async function gerarAction() {
    "use server";
    await generateMonthlyPayments(competencia);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cobranças</h1>
          <p className="text-sm text-gray-500">
            Controle de pagamentos · {formatCompetencia(competencia)}
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

          <form action={gerarAction}>
            <button type="submit" className="btn-primary">
              Gerar cobranças do mês
            </button>
          </form>
        </div>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            A receber (total)
          </p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(total)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Recebido
          </p>
          <p className="mt-1 text-xl font-bold text-green-700">
            {formatCurrency(recebido)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Pendente
          </p>
          <p className="mt-1 text-xl font-bold text-amber-700">
            {formatCurrency(pendente)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Em atraso
          </p>
          <p className="mt-1 text-xl font-bold text-red-700">
            {atrasados} cliente(s)
          </p>
        </div>
      </div>

      {pagamentos.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          Nenhuma cobrança para {formatCompetencia(competencia)}. Clique em{" "}
          <span className="font-medium">&quot;Gerar cobranças do mês&quot;</span>{" "}
          para criar as cobranças dos clientes recorrentes ativos.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vencimento</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pagamentos.map((p) => {
                const atrasada =
                  p.status === "PENDENTE" &&
                  estaAtrasada(competencia, p.client.diaVencimento, hoje);
                const marcar = setPaymentStatus.bind(
                  null,
                  p.id,
                  p.status === "PAGO" ? "PENDENTE" : "PAGO"
                );
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/clientes/${p.client.id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {p.client.nomeRazaoSocial}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.client.diaVencimento
                        ? `Dia ${p.client.diaVencimento}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {formatCurrency(Number(p.valor))}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`badge ${
                          atrasada
                            ? PAYMENT_ATRASADO_BADGE
                            : PAYMENT_STATUS_BADGE[p.status]
                        }`}
                      >
                        {atrasada
                          ? "Atrasado"
                          : PAYMENT_STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={marcar}>
                        <button
                          type="submit"
                          className={
                            p.status === "PAGO"
                              ? "btn-secondary"
                              : "btn-primary"
                          }
                        >
                          {p.status === "PAGO"
                            ? "Desfazer"
                            : "Marcar pago"}
                        </button>
                      </form>
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
