import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AgenciasPage() {
  const agencies = await prisma.partnerAgency.findMany({
    include: { _count: { select: { clientes: true } } },
    orderBy: { nome: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agências Parceiras</h1>
          <p className="text-sm text-gray-500">{agencies.length} agência(s)</p>
        </div>
        <Link href="/agencias/novo" className="btn-primary">
          + Nova agência
        </Link>
      </div>

      {agencies.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          Nenhuma agência parceira cadastrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((a) => (
            <Link
              key={a.id}
              href={`/agencias/${a.id}`}
              className="card p-5 transition-shadow hover:shadow-md"
            >
              <h2 className="font-semibold text-brand-700">{a.nome}</h2>
              {a.contatoNome && (
                <p className="text-sm text-gray-500">{a.contatoNome}</p>
              )}
              <p className="mt-3 text-sm text-gray-600">
                {a._count.clientes} cliente(s) vinculado(s)
              </p>
              {a.percentualComissao && (
                <p className="text-xs text-gray-400">
                  Comissão: {Number(a.percentualComissao)}%
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
