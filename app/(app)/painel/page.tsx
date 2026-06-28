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
  STATUS_LABELS,
  STATUS_ORDER,
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

// Cores fixas por status para o gráfico de rosca (não usa variáveis CSS por ser SVG server)
const STATUS_CHART_COLORS: Record<string, string> = {
  LEAD: "#9ca3af",
  EM_NEGOCIACAO: "#f59e0b",
  ATIVO: "#10b981",
  PAUSADO: "#e5142b",
  ENCERRADO: "#ef4444",
};

// -------------------------------------------------------------------
// Componente: Stat Card com sparkline conceitual
// -------------------------------------------------------------------
function StatCard({
  label,
  value,
  hint,
  accent,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      {/* SVG conceitual: linha de tendência sutil no fundo */}
      <svg
        className="absolute bottom-0 right-0 h-16 w-32 opacity-[0.06]"
        viewBox="0 0 128 64"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M0 56 C20 48, 32 52, 44 40 S64 20, 80 28 S100 16, 128 8"
          stroke="currentColor"
          strokeWidth="3"
          className="text-accent-primary"
        />
      </svg>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
          <p
            className={`sensivel mt-1.5 text-2xl font-bold font-mono ${accent ?? "text-text-primary"}`}
          >
            {value}
          </p>
          {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card bg-accent-subtle text-accent-primary">
          {icon}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Componente: SVG Donut Chart (status pipeline)
// -------------------------------------------------------------------
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-text-muted">
        Sem dados
      </div>
    );
  }

  const radius = 60;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width="160" height="160" viewBox="0 0 160 160">
          {/* Track de fundo */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="var(--border-default)"
            strokeWidth={stroke}
          />
          {/* Segmentos */}
          {data.map((d) => {
            const pct = d.value / total;
            const dashLength = pct * circumference;
            const dashOffset = -cumulativeOffset * circumference;
            cumulativeOffset += pct;
            return (
              <circle
                key={d.label}
                cx="80" cy="80" r={radius}
                fill="none"
                stroke={d.color}
                strokeWidth={stroke}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                strokeLinecap="round"
                transform="rotate(-90 80 80)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            );
          })}
          {/* Número central */}
          <text x="80" y="76" textAnchor="middle" className="fill-text-primary text-2xl font-bold" style={{ fontFamily: "'Inter', sans-serif", fontSize: "28px", fontWeight: 700 }}>
            {total}
          </text>
          <text x="80" y="96" textAnchor="middle" className="fill-text-muted" style={{ fontFamily: "'Inter', sans-serif", fontSize: "11px" }}>
            clientes
          </text>
        </svg>
      </div>

      {/* Legenda */}
      <ul className="space-y-1.5 text-sm">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.color }}
            />
            <span className="text-text-secondary">{d.label}</span>
            <span className="ml-auto font-mono font-medium text-text-primary">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// -------------------------------------------------------------------
// Componente: Barra horizontal de categoria
// -------------------------------------------------------------------
function HorizontalBars({ data }: { data: { label: string; count: number; revenue: number }[] }) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      {data.map((d) => {
        const pct = (d.count / maxCount) * 100;
        return (
          <div key={d.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-text-secondary">{d.label}</span>
              <span className="font-mono font-medium text-text-primary">{d.count}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-elevated">
              <div
                className="h-full rounded-full bg-accent-primary transition-all duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-0.5 text-right text-xs font-mono text-text-muted sensivel">
              {formatCurrency(d.revenue)}/mês
            </p>
          </div>
        );
      })}
    </div>
  );
}

// -------------------------------------------------------------------
// Página principal: Painel / Dashboard
// -------------------------------------------------------------------
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

  // Dados para o donut chart de status
  const donutData = STATUS_ORDER.map((s) => ({
    label: STATUS_LABELS[s],
    value: resumo.porStatus[s],
    color: STATUS_CHART_COLORS[s] ?? "#6b7280",
  }));

  // Dados para as barras horizontais de categoria
  const barData = CATEGORIA_ORDER.map((c) => ({
    label: CATEGORIA_LABELS[c],
    count: resumo.porCategoria[c].count,
    revenue: resumo.porCategoria[c].faturamento,
  }));

  // Margem de lucro
  const margemPct =
    resumo.faturamentoMensal > 0
      ? ((resumo.lucro / resumo.faturamentoMensal) * 100).toFixed(0)
      : "0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Painel</h1>
        <p className="text-sm text-text-secondary">
          Visão geral · {formatCompetencia(competencia)}
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BENTO GRID — Dashboard principal
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Stat: Faturamento */}
        <StatCard
          label="Faturamento mensal"
          value={formatCurrency(resumo.faturamentoMensal)}
          hint="Ativos · inclui hospedagem ÷12"
          icon={
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <path d="M10 2a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 2zM10 15a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 0110 15zM10 7a3 3 0 100 6 3 3 0 000-6zM15.657 5.404a.75.75 0 10-1.06-1.06l-1.061 1.06a.75.75 0 001.06 1.06l1.06-1.06zM6.464 14.596a.75.75 0 10-1.06-1.06l-1.06 1.06a.75.75 0 001.06 1.06l1.06-1.06zM18 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 0118 10zM5 10a.75.75 0 01-.75.75h-1.5a.75.75 0 010-1.5h1.5A.75.75 0 015 10zM14.596 15.657a.75.75 0 001.06-1.06l-1.06-1.061a.75.75 0 10-1.06 1.06l1.06 1.06zM5.404 6.464a.75.75 0 001.06-1.06l-1.06-1.06a.75.75 0 10-1.06 1.06l1.06 1.06z" />
            </svg>
          }
        />

        {/* Stat: Custo */}
        <StatCard
          label="Custo mensal"
          value={formatCurrency(resumo.custoMensal)}
          icon={
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <path fillRule="evenodd" d="M5.5 3A2.5 2.5 0 003 5.5v2.879a2.5 2.5 0 00.732 1.767l6.5 6.5a2.5 2.5 0 003.536 0l2.878-2.878a2.5 2.5 0 000-3.536l-6.5-6.5A2.5 2.5 0 008.38 3H5.5zM6 7a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          }
        />

        {/* Stat: Lucro */}
        <StatCard
          label="Lucro estimado"
          value={formatCurrency(resumo.lucro)}
          accent={resumo.lucro >= 0 ? "text-status-success" : "text-status-error"}
          hint={`Margem ${margemPct}%`}
          icon={
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.93l-3.042.815a.75.75 0 01-.53-.919z" clipRule="evenodd" />
            </svg>
          }
        />

        {/* Stat: Total de Clientes */}
        <StatCard
          label="Total de clientes"
          value={String(resumo.totalClientes)}
          hint={`${resumo.porStatus.ATIVO} ativos`}
          icon={
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor">
              <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
            </svg>
          }
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BENTO GRID — Gráficos (linha 2)
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Pipeline de Status — Donut Chart (ocupa 5 colunas) */}
        <section className="card p-6 lg:col-span-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Pipeline de clientes
            </h2>
            <Link
              href="/comercial"
              className="text-xs text-accent-primary hover:underline"
            >
              Ver Kanban →
            </Link>
          </div>
          <DonutChart data={donutData} />
        </section>

        {/* Categorias — Horizontal Bars (ocupa 4 colunas) */}
        <section className="card p-6 lg:col-span-4">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wide text-text-muted">
            Receita por categoria
          </h2>
          <HorizontalBars data={barData} />
        </section>

        {/* Cobranças do mês — Progress (ocupa 3 colunas) */}
        <section className="card p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">
              Cobranças do mês
            </h2>
            <Link
              href="/financeiro/cobrancas"
              className="text-xs text-accent-primary hover:underline"
            >
              Ver tudo →
            </Link>
          </div>

          {totalCobranca === 0 ? (
            <p className="text-sm text-text-muted">
              Nenhuma cobrança gerada para {formatCompetencia(competencia)}.{" "}
              <Link
                href="/financeiro/cobrancas"
                className="text-accent-primary hover:underline"
              >
                Gerar agora
              </Link>
              .
            </p>
          ) : (
            <div className="space-y-4">
              {/* Gauge visual circular */}
              <div className="mx-auto w-fit">
                <svg width="120" height="120" viewBox="0 0 120 120">
                  <circle
                    cx="60" cy="60" r="48"
                    fill="none"
                    stroke="var(--border-default)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60" cy="60" r="48"
                    fill="none"
                    stroke="var(--status-success)"
                    strokeWidth="10"
                    strokeDasharray={`${(pctRecebido / 100) * (2 * Math.PI * 48)} ${2 * Math.PI * 48}`}
                    strokeLinecap="round"
                    transform="rotate(-90 60 60)"
                    style={{ transition: "stroke-dasharray 0.8s ease" }}
                  />
                  <text x="60" y="56" textAnchor="middle" style={{ fontFamily: "'Inter', sans-serif", fontSize: "20px", fontWeight: 700 }} className="fill-text-primary">
                    {pctRecebido.toFixed(0)}%
                  </text>
                  <text x="60" y="72" textAnchor="middle" style={{ fontFamily: "'Inter', sans-serif", fontSize: "10px" }} className="fill-text-muted">
                    recebido
                  </text>
                </svg>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-status-success">Recebido</span>
                  <span className="sensivel font-mono font-medium">{formatCurrency(recebido)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-status-warning">Pendente</span>
                  <span className="sensivel font-mono font-medium">{formatCurrency(pendente)}</span>
                </div>
                <div className="flex justify-between border-t border-border-subtle pt-1.5">
                  <span className="text-text-muted">Total</span>
                  <span className="sensivel font-mono font-semibold">{formatCurrency(totalCobranca)}</span>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          Próximos vencimentos
          ═══════════════════════════════════════════════════════════════ */}
      <section className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-text-muted">
          Próximos vencimentos (14 dias)
        </h2>
        {vencimentos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {/* Empty state SVG: prancheta vazia */}
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="mb-3 text-text-muted opacity-30">
              <rect x="16" y="8" width="32" height="48" rx="4" stroke="currentColor" strokeWidth="2" />
              <rect x="22" y="4" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="2" fill="var(--surface-card)" />
              <line x1="24" y1="24" x2="40" y2="24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
              <line x1="24" y1="32" x2="36" y2="32" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
              <line x1="24" y1="40" x2="32" y2="40" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
            </svg>
            <p className="text-sm text-text-muted">
              Nenhum vencimento ou renovação nos próximos 14 dias.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border-subtle">
            {vencimentos.map((v) => (
              <li
                key={`${v.clientId}-${v.tipo}`}
                className="flex items-center justify-between gap-4 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <Link
                    href={`/clientes/${v.clientId}`}
                    className="font-medium text-accent-primary hover:underline"
                  >
                    {v.nome}
                  </Link>
                  <span className="ml-2 text-xs text-text-muted">
                    {v.tipo === "MENSAL" ? "Mensalidade" : "Renovação"}
                  </span>
                </div>
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <span className="sensivel font-mono text-text-secondary">
                    {formatCurrency(v.valor)}
                  </span>
                  <span
                    className={`text-xs ${
                      v.emDias < 0
                        ? "font-medium text-status-error"
                        : v.emDias <= 3
                          ? "font-medium text-status-warning"
                          : "text-text-muted"
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
