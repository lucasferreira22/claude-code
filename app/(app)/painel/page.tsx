import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  summarize,
  proximosVencimentos,
  type FinanceClient,
} from "@/lib/finance";
import {
  CATEGORIA_LABELS,
  CATEGORIA_ORDER,
  CATEGORIA_BADGE,
  STATUS_LABELS,
  STATUS_ORDER,
  STATUS_BADGE,
  formatCurrency,
  formatDate,
  currentCompetencia,
  formatCompetencia,
} from "@/lib/labels";

// Seleção padrão dos campos usados nos cálculos financeiros.
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

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${accent ?? "text-gray-900"}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

export default async function PainelPage() {
  const competencia = currentCompetencia();

  const [clients, pagamentos] = await Promise.all([
    prisma.client.findMany({ select: financeSelect }),
    prisma.payment.findMany({
      where: { competencia },
      select: { valor: true, status: true },
    }),
  ]);

  const resumo = summarize(clients as unknown as FinanceClient[]);
  const vencimentos = proximosVencimentos(
    clients as unknown as FinanceClient[],
    14
  );

  // Resumo das cobranças do mês corrente
  const recebido = pagamentos
    .filter((p) => p.status === "PAGO")
    .reduce((s, p) => s + Number(p.valor), 0);
  const pendente = pagamentos
    .filter((p) => p.status === "PENDENTE")
    .reduce((s, p) => s + Number(p.valor), 0);
  const totalCobranca = recebido + pendente;
  const pctRecebido = totalCobranca > 0 ? (recebido / totalCobranca) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-sm text-gray-500">
          Visão geral · {formatCompetencia(competencia)}
        </p>
      </div>

      {/* Financeiro */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat
          label="Faturamento mensal"
          value={formatCurrency(resumo.faturamentoMensal)}
          hint="Ativos · inclui hospedagem ÷12"
        />
        <Stat
          label="Custo mensal"
          value={formatCurrency(resumo.custoMensal)}
        />
        <Stat
          label="Lucro estimado"
          value={formatCurrency(resumo.lucro)}
          accent={resumo.lucro >= 0 ? "text-green-700" : "text-red-700"}
          hint="Faturamento − custo"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Cobranças do mês */}
        <section className="card p-6 lg:col-span-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Cobranças do mês
            </h2>
            <Link
              href="/financeiro/cobrancas"
              className="text-xs text-brand-700 hover:underline"
            >
              Ver tudo →
            </Link>
          </div>

          {totalCobranca === 0 ? (
            <p className="text-sm text-gray-400">
              Nenhuma cobrança gerada para {formatCompetencia(competencia)}.{" "}
              <Link
                href="/financeiro/cobrancas"
                className="text-brand-700 hover:underline"
              >
                Gerar agora
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{ width: `${pctRecebido}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-700">
                  Recebido: {formatCurrency(recebido)}
                </span>
                <span className="text-amber-700">
                  Pendente: {formatCurrency(pendente)}
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {pctRecebido.toFixed(0)}% recebido de{" "}
                {formatCurrency(totalCobranca)}
              </p>
            </div>
          )}
        </section>

        {/* Clientes por categoria */}
        <section className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Clientes por categoria
          </h2>
          <ul className="space-y-2">
            {CATEGORIA_ORDER.map((c) => (
              <li key={c} className="flex items-center justify-between text-sm">
                <span className={`badge ${CATEGORIA_BADGE[c]}`}>
                  {CATEGORIA_LABELS[c]}
                </span>
                <span className="font-medium text-gray-700">
                  {resumo.porCategoria[c].count}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between border-t border-gray-100 pt-2 text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-semibold">{resumo.totalClientes}</span>
            </li>
          </ul>
        </section>

        {/* Clientes por status */}
        <section className="card p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Clientes por status
          </h2>
          <ul className="space-y-2">
            {STATUS_ORDER.map((s) => (
              <li key={s} className="flex items-center justify-between text-sm">
                <span className={`badge ${STATUS_BADGE[s]}`}>
                  {STATUS_LABELS[s]}
                </span>
                <span className="font-medium text-gray-700">
                  {resumo.porStatus[s]}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Próximos vencimentos */}
      <section className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Próximos vencimentos (14 dias)
        </h2>
        {vencimentos.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nenhum vencimento ou renovação nos próximos 14 dias.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {vencimentos.map((v) => (
              <li
                key={`${v.clientId}-${v.tipo}`}
                className="flex items-center justify-between gap-4 py-2 text-sm"
              >
                <div className="min-w-0">
                  <Link
                    href={`/clientes/${v.clientId}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    {v.nome}
                  </Link>
                  <span className="ml-2 text-xs text-gray-400">
                    {v.tipo === "MENSAL" ? "Mensalidade" : "Renovação"}
                  </span>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <span className="text-gray-600">{formatCurrency(v.valor)}</span>
                  <span
                    className={`text-xs ${
                      v.emDias < 0
                        ? "font-medium text-red-600"
                        : v.emDias <= 3
                          ? "font-medium text-amber-600"
                          : "text-gray-400"
                    }`}
                  >
                    {v.emDias < 0
                      ? `venceu há ${Math.abs(v.emDias)}d`
                      : v.emDias === 0
                        ? "hoje"
                        : `em ${v.emDias}d`}{" "}
                    · {formatDate(v.data)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
