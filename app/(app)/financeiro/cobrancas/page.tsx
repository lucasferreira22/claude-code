import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { generateMonthlyPayments } from "@/lib/actions/payments";
import { waLink, cobrancaMessage } from "@/lib/whatsapp";
import { CobrancasTabela, type CobrancaRow } from "@/components/cobrancas-tabela";
import {
  formatCurrency,
  currentCompetencia,
  formatCompetencia,
  competenciaOptions,
} from "@/lib/labels";

type FiltroCobranca = "atrasado" | "pago" | "pendente";
type SearchParams = { mes?: string; filtro?: string };

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
        select: {
          id: true,
          nomeRazaoSocial: true,
          diaVencimento: true,
          contatos: {
            where: { tipo: "WHATSAPP" },
            select: { valor: true },
            take: 1,
          },
        },
      },
    },
    // Ordena pela data de cobrança (dia de vencimento); sem dia definido vai
    // para o fim (padrão do Postgres para ASC). Desempata por nome.
    orderBy: [
      { client: { diaVencimento: "asc" } },
      { client: { nomeRazaoSocial: "asc" } },
    ],
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

  // Filtro da tabela (os cards do resumo continuam mostrando o total do mês).
  const filtro: FiltroCobranca | null =
    searchParams.filtro === "atrasado" ||
    searchParams.filtro === "pago" ||
    searchParams.filtro === "pendente"
      ? searchParams.filtro
      : null;

  const visiveis = pagamentos.filter((p) => {
    if (filtro === "pago") return p.status === "PAGO";
    if (filtro === "pendente") return p.status === "PENDENTE";
    if (filtro === "atrasado")
      return (
        p.status === "PENDENTE" &&
        estaAtrasada(competencia, p.client.diaVencimento, hoje)
      );
    return true;
  });

  // Monta o link de um card mantendo a competência; clicar no filtro ativo limpa.
  const hrefFiltro = (valor: FiltroCobranca | null) => {
    const params = new URLSearchParams({ mes: competencia });
    const proximo = filtro === valor ? null : valor;
    if (proximo) params.set("filtro", proximo);
    return `/financeiro/cobrancas?${params.toString()}`;
  };

  const FILTRO_LABELS: Record<FiltroCobranca, string> = {
    atrasado: "em atraso",
    pago: "pagas",
    pendente: "pendentes",
  };

  // Server action inline: gera as cobranças do mês selecionado.
  async function gerarAction() {
    "use server";
    await generateMonthlyPayments(competencia);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Cobranças recorrentes mensais</h1>
          <p className="text-sm text-text-secondary">
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

      {/* Resumo — cada card filtra a tabela ao ser clicado */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link
          href={hrefFiltro(null)}
          className={`card p-5 transition hover:border-accent-subtle-border ${
            filtro === null ? "ring-active" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-text-muted">
            A receber (total)
          </p>
          <p className="sensivel mt-1 text-xl font-bold">
            {formatCurrency(total)}
          </p>
        </Link>
        <Link
          href={hrefFiltro("pago")}
          className={`card p-5 transition hover:border-accent-subtle-border ${
            filtro === "pago" ? "ring-active" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Recebido
          </p>
          <p className="sensivel mt-1 text-xl font-bold text-status-success">
            {formatCurrency(recebido)}
          </p>
        </Link>
        <Link
          href={hrefFiltro("pendente")}
          className={`card p-5 transition hover:border-accent-subtle-border ${
            filtro === "pendente" ? "ring-active" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Pendente
          </p>
          <p className="sensivel mt-1 text-xl font-bold text-status-warning">
            {formatCurrency(pendente)}
          </p>
        </Link>
        <Link
          href={hrefFiltro("atrasado")}
          className={`card p-5 transition hover:border-accent-subtle-border ${
            filtro === "atrasado" ? "ring-active" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Em atraso
          </p>
          <p className="mt-1 text-xl font-bold text-status-error">
            {atrasados} cliente(s)
          </p>
        </Link>
      </div>

      {filtro && (
        <p className="text-sm text-text-secondary">
          Mostrando apenas cobranças{" "}
          <span className="font-medium">{FILTRO_LABELS[filtro]}</span> (
          {visiveis.length}).{" "}
          <Link
            href={hrefFiltro(null)}
            className="text-accent-primary hover:underline"
          >
            Ver todas
          </Link>
        </p>
      )}

      {pagamentos.length === 0 ? (
        <div className="card p-10 text-center text-text-secondary">
          Nenhuma cobrança para {formatCompetencia(competencia)}. Clique em{" "}
          <span className="font-medium">&quot;Gerar cobranças do mês&quot;</span>{" "}
          para criar as cobranças dos clientes recorrentes ativos.
        </div>
      ) : (
        <CobrancasTabela
          rows={visiveis.map((p): CobrancaRow => {
            const atrasada =
              p.status === "PENDENTE" &&
              estaAtrasada(competencia, p.client.diaVencimento, hoje);
            return {
              paymentId: p.id,
              clienteId: p.client.id,
              clienteNome: p.client.nomeRazaoSocial,
              diaVencimento: p.client.diaVencimento,
              valor: Number(p.valor),
              status: p.status,
              atrasada,
              // Lembrete pronto no WhatsApp só para cobranças em aberto.
              whatsappHref:
                p.status === "PENDENTE"
                  ? waLink(
                      p.client.contatos[0]?.valor,
                      cobrancaMessage({
                        competenciaLabel: formatCompetencia(competencia),
                        valorLabel: formatCurrency(Number(p.valor)),
                        diaVencimento: p.client.diaVencimento,
                        atrasada,
                      })
                    )
                  : null,
            };
          })}
        />
      )}
    </div>
  );
}
