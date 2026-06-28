import Link from "next/link";
import {
  getMetaInsights,
  metaConfigurado,
  META_PERIODOS,
  type MetaPeriodo,
} from "@/lib/meta";
import { formatCurrency } from "@/lib/labels";

function inteiro(n: number) {
  return n.toLocaleString("pt-BR");
}

function Metrica({
  label,
  valor,
  sensivel,
}: {
  label: string;
  valor: string;
  sensivel?: boolean;
}) {
  return (
    <div className="rounded-md border border-border-subtle p-3">
      <p className="text-xs uppercase tracking-wide text-text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${sensivel ? "sensivel" : ""}`}>
        {valor}
      </p>
    </div>
  );
}

// Card de métricas do Meta para um cliente. Server component assíncrono.
export async function MetaMetrics({
  clientId,
  adAccountId,
  periodo,
}: {
  clientId: string;
  adAccountId: string;
  periodo: MetaPeriodo;
}) {
  let erro: string | null = null;
  let dados = null as Awaited<ReturnType<typeof getMetaInsights>>;
  try {
    dados = await getMetaInsights(adAccountId, periodo);
  } catch (e) {
    erro = e instanceof Error ? e.message : "erro desconhecido";
  }

  const leads = dados?.resultados.find((r) => r.tipo === "Leads")?.valor ?? 0;
  const cpl = leads > 0 && dados ? dados.spend / leads : null;

  return (
    <section className="card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Métricas do Meta
        </h2>
        <div className="flex gap-1">
          {META_PERIODOS.map((p) => (
            <Link
              key={p.key}
              href={`/clientes/${clientId}?meta=${p.key}`}
              scroll={false}
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                p.key === periodo
                  ? "bg-accent-primary text-white"
                  : "border border-border-default text-text-secondary hover:bg-surface-elevated"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {!metaConfigurado() ? (
        <p className="text-sm text-text-muted">
          Integração com o Meta não configurada (defina{" "}
          <code className="font-mono">META_ACCESS_TOKEN</code> no ambiente).
        </p>
      ) : erro ? (
        <p className="text-sm text-text-secondary">
          Não foi possível carregar as métricas.
          <br />
          <span className="font-mono text-xs text-status-error">{erro}</span>
        </p>
      ) : !dados || dados.impressions === 0 ? (
        <p className="text-sm text-text-muted">
          Sem dados de anúncios no período selecionado.
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metrica
              label="Investido"
              valor={formatCurrency(dados.spend)}
              sensivel
            />
            <Metrica label="Alcance" valor={inteiro(dados.reach)} />
            <Metrica label="Impressões" valor={inteiro(dados.impressions)} />
            <Metrica label="Cliques" valor={inteiro(dados.clicks)} />
            <Metrica label="CTR" valor={`${dados.ctr.toFixed(2)}%`} />
            <Metrica
              label="CPC"
              valor={formatCurrency(dados.cpc)}
              sensivel
            />
          </div>

          {dados.resultados.length > 0 && (
            <div className="border-t border-border-subtle pt-3">
              <p className="mb-2 text-xs uppercase tracking-wide text-text-muted">
                Resultados
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                {dados.resultados.map((r) => (
                  <span key={r.tipo} className="text-text-primary">
                    {r.tipo}:{" "}
                    <span className="font-semibold">{inteiro(r.valor)}</span>
                  </span>
                ))}
                {cpl !== null && (
                  <span className="text-text-primary">
                    CPL:{" "}
                    <span className="sensivel font-semibold">
                      {formatCurrency(cpl)}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
