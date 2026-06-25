import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  generateMonthlyPayments,
  setPaymentStatus,
} from "@/lib/actions/payments";
import { waLink, cobrancaMessage } from "@/lib/whatsapp";
import {
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_ATRASADO_BADGE,
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

      {/* Resumo — cada card filtra a tabela ao ser clicado */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link
          href={hrefFiltro(null)}
          className={`card p-5 transition hover:border-brand-300 ${
            filtro === null ? "ring-2 ring-brand-500" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-400">
            A receber (total)
          </p>
          <p className="mt-1 text-xl font-bold">{formatCurrency(total)}</p>
        </Link>
        <Link
          href={hrefFiltro("pago")}
          className={`card p-5 transition hover:border-brand-300 ${
            filtro === "pago" ? "ring-2 ring-green-500" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Recebido
          </p>
          <p className="mt-1 text-xl font-bold text-green-700">
            {formatCurrency(recebido)}
          </p>
        </Link>
        <Link
          href={hrefFiltro("pendente")}
          className={`card p-5 transition hover:border-brand-300 ${
            filtro === "pendente" ? "ring-2 ring-amber-500" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Pendente
          </p>
          <p className="mt-1 text-xl font-bold text-amber-700">
            {formatCurrency(pendente)}
          </p>
        </Link>
        <Link
          href={hrefFiltro("atrasado")}
          className={`card p-5 transition hover:border-brand-300 ${
            filtro === "atrasado" ? "ring-2 ring-red-500" : ""
          }`}
        >
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Em atraso
          </p>
          <p className="mt-1 text-xl font-bold text-red-700">
            {atrasados} cliente(s)
          </p>
        </Link>
      </div>

      {filtro && (
        <p className="text-sm text-gray-500">
          Mostrando apenas cobranças{" "}
          <span className="font-medium">{FILTRO_LABELS[filtro]}</span> (
          {visiveis.length}).{" "}
          <Link
            href={hrefFiltro(null)}
            className="text-brand-700 hover:underline"
          >
            Ver todas
          </Link>
        </p>
      )}

      {pagamentos.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          Nenhuma cobrança para {formatCompetencia(competencia)}. Clique em{" "}
          <span className="font-medium">&quot;Gerar cobranças do mês&quot;</span>{" "}
          para criar as cobranças dos clientes recorrentes ativos.
        </div>
      ) : visiveis.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          Nenhuma cobrança {filtro ? FILTRO_LABELS[filtro] : ""} em{" "}
          {formatCompetencia(competencia)}.{" "}
          <Link href={hrefFiltro(null)} className="text-brand-700 hover:underline">
            Ver todas
          </Link>
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
              {visiveis.map((p) => {
                const atrasada =
                  p.status === "PENDENTE" &&
                  estaAtrasada(competencia, p.client.diaVencimento, hoje);
                const marcar = setPaymentStatus.bind(
                  null,
                  p.id,
                  p.status === "PAGO" ? "PENDENTE" : "PAGO"
                );
                // Link de WhatsApp com lembrete pronto (só para cobranças em aberto)
                const whatsappHref =
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
                    : null;
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {whatsappHref && (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Enviar lembrete no WhatsApp"
                            className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
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
                              p.status === "PAGO"
                                ? "btn-secondary"
                                : "btn-primary"
                            }
                          >
                            {p.status === "PAGO" ? "Desfazer" : "Marcar pago"}
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
