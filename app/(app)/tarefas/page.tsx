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
  clienteHref,
}: {
  d: Demanda;
  clienteNome?: string | null;
  clienteHref?: string | null;
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
        {clienteNome &&
          (clienteHref ? (
            <Link
              href={clienteHref}
              className="ml-2 text-xs text-brand-700 hover:underline"
            >
              {clienteNome}
            </Link>
          ) : (
            <span className="ml-2 text-xs text-gray-400">{clienteNome}</span>
          ))}
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

type Item = { demanda: Demanda; clienteNome: string | null };

function Bloco({
  titulo,
  itens,
  hrefDe,
  vazio,
}: {
  titulo: string;
  itens: Item[];
  hrefDe: (nome: string | null) => string | null;
  vazio?: string;
}) {
  return (
    <section className="card p-6">
      <h2 className="mb-3 flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-gray-500">
        {titulo}
        <span className="text-xs font-normal text-gray-400">{itens.length}</span>
      </h2>
      {itens.length === 0 ? (
        <p className="text-sm text-gray-400">{vazio ?? "Nada por aqui."}</p>
      ) : (
        <ul className="divide-y divide-gray-100">
          {itens.map((it) => (
            <DemandaItem
              key={it.demanda.id}
              d={it.demanda}
              clienteNome={it.clienteNome}
              clienteHref={hrefDe(it.clienteNome)}
            />
          ))}
        </ul>
      )}
    </section>
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

  let erroMsg: string | null = null;
  let comVencimento: Item[] = [];
  try {
    const data = await getTarefasOperacional();
    comVencimento = data.comVencimento;
  } catch (e) {
    erroMsg = e instanceof Error ? e.message : "erro desconhecido";
  }

  // Casa o nome do cliente (Todoist) com o cliente do CRM para gerar o link.
  const clientes = await prisma.client.findMany({
    select: { id: true, nomeRazaoSocial: true },
  });
  const idPorNome = new Map(
    clientes.map((c) => [normalizarNome(c.nomeRazaoSocial), c.id])
  );
  const hrefDe = (nome: string | null): string | null => {
    if (!nome) return null;
    const n = normalizarNome(nome);
    if (idPorNome.has(n)) return `/clientes/${idPorNome.get(n)}`;
    for (const [nm, id] of idPorNome)
      if (nm.includes(n) || n.includes(nm)) return `/clientes/${id}`;
    return null;
  };

  // Só tarefas com prazo, em buckets ordenados: atrasadas → hoje → próximas.
  // (comVencimento já vem ordenado por emDias crescente.)
  const atrasadas = comVencimento.filter((v) => (v.demanda.emDias ?? 0) < 0);
  const hoje = comVencimento.filter((v) => v.demanda.emDias === 0);
  const proximas = comVencimento.filter((v) => (v.demanda.emDias ?? 0) > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tarefas</h1>
        <p className="text-sm text-gray-500">
          Demandas com prazo, sincronizadas do Todoist (somente leitura) ·{" "}
          {comVencimento.length} com prazo
        </p>
      </div>

      {erroMsg ? (
        <div className="card p-8 text-center text-gray-500">
          Não foi possível carregar as tarefas do Todoist agora.
          <br />
          <span className="mt-2 block font-mono text-xs text-red-500">
            {erroMsg}
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          <Bloco
            titulo="Atrasadas"
            itens={atrasadas}
            hrefDe={hrefDe}
            vazio="Nenhuma tarefa atrasada. 🎉"
          />
          <Bloco
            titulo="Hoje"
            itens={hoje}
            hrefDe={hrefDe}
            vazio="Nada para hoje."
          />
          <Bloco
            titulo="Próximas"
            itens={proximas}
            hrefDe={hrefDe}
            vazio="Sem tarefas futuras com prazo."
          />
        </div>
      )}
    </div>
  );
}
