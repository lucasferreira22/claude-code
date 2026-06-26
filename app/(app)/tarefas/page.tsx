import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  getTarefasOperacional,
  todoistConfigurado,
  normalizarNome,
  type Demanda,
} from "@/lib/todoist";

function VencBadge({ emDias }: { emDias: number | null }) {
  if (emDias === null) return null;
  const cls =
    emDias < 0
      ? "bg-red-100 text-red-800"
      : emDias === 0
        ? "bg-amber-100 text-amber-800"
        : "bg-gray-100 text-gray-600";
  const txt =
    emDias < 0
      ? `atrasada ${Math.abs(emDias)}d`
      : emDias === 0
        ? "hoje"
        : `em ${emDias}d`;
  return <span className={`badge ${cls}`}>{txt}</span>;
}

function DemandaItem({
  d,
  clienteNome,
}: {
  d: Demanda;
  clienteNome?: string | null;
}) {
  return (
    <li className="flex items-center justify-between gap-3 py-2 text-sm">
      <div className="min-w-0">
        <a
          href={d.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-800 hover:underline"
        >
          {d.titulo}
        </a>
        {clienteNome && (
          <span className="ml-2 text-xs text-gray-400">{clienteNome}</span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
        {d.recorrente && <span className="text-xs text-gray-300">↻</span>}
        {d.vencimentoLabel && (
          <span className="text-xs text-gray-500">{d.vencimentoLabel}</span>
        )}
        <VencBadge emDias={d.emDias} />
      </div>
    </li>
  );
}

export default async function TarefasPage() {
  if (!todoistConfigurado()) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <div className="card p-8 text-center text-gray-500">
          A integração com o Todoist ainda não está configurada. Defina a
          variável <code className="font-mono">TODOIST_API_TOKEN</code> no
          ambiente (Vercel) para exibir as tarefas aqui.
        </div>
      </div>
    );
  }

  let erro = false;
  let data = { porCliente: [] as Awaited<
    ReturnType<typeof getTarefasOperacional>
  >["porCliente"], comVencimento: [] as Awaited<
    ReturnType<typeof getTarefasOperacional>
  >["comVencimento"] };
  try {
    data = await getTarefasOperacional();
  } catch {
    erro = true;
  }

  // Casa as tarefas-pai (clientes do Todoist) com os clientes do CRM por nome.
  const clientes = await prisma.client.findMany({
    select: { id: true, nomeRazaoSocial: true },
  });
  const idPorNome = new Map(
    clientes.map((c) => [normalizarNome(c.nomeRazaoSocial), c.id])
  );
  const clienteId = (nome: string) => {
    const n = normalizarNome(nome);
    if (idPorNome.has(n)) return idPorNome.get(n)!;
    for (const [nm, id] of idPorNome)
      if (nm.includes(n) || n.includes(nm)) return id;
    return null;
  };

  const hojeEAtrasadas = data.comVencimento.filter(
    (v) => v.demanda.emDias !== null && v.demanda.emDias <= 0
  );
  const porClienteAtivos = data.porCliente
    .filter((c) => c.pendentes.length > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const totalPendentes = data.porCliente.reduce(
    (s, c) => s + c.pendentes.length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <p className="text-sm text-gray-500">
          Demandas dos clientes sincronizadas do Todoist (somente leitura) ·{" "}
          {totalPendentes} pendente(s)
        </p>
      </div>

      {erro ? (
        <div className="card p-8 text-center text-gray-500">
          Não foi possível carregar as tarefas do Todoist agora. Tente novamente
          em instantes.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Hoje e atrasadas */}
          <section className="card p-6 lg:col-span-1">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Hoje e atrasadas
            </h2>
            {hojeEAtrasadas.length === 0 ? (
              <p className="text-sm text-gray-400">Nada vencendo. 🎉</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {hojeEAtrasadas.map((v) => (
                  <DemandaItem
                    key={v.demanda.id}
                    d={v.demanda}
                    clienteNome={v.clienteNome}
                  />
                ))}
              </ul>
            )}
          </section>

          {/* Por cliente */}
          <section className="card p-6 lg:col-span-2">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Demandas por cliente
            </h2>
            {porClienteAtivos.length === 0 ? (
              <p className="text-sm text-gray-400">
                Nenhuma demanda pendente encontrada no projeto Operacional.
              </p>
            ) : (
              <div className="space-y-5">
                {porClienteAtivos.map((c) => {
                  const cid = clienteId(c.nome);
                  return (
                    <div key={c.taskId}>
                      <div className="mb-1 flex items-center gap-2">
                        {cid ? (
                          <Link
                            href={`/clientes/${cid}`}
                            className="text-sm font-semibold text-brand-700 hover:underline"
                          >
                            {c.nome}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-gray-800">
                            {c.nome}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {c.pendentes.length}
                        </span>
                      </div>
                      <ul className="divide-y divide-gray-100 pl-1">
                        {c.pendentes.map((d) => (
                          <DemandaItem key={d.id} d={d} />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
