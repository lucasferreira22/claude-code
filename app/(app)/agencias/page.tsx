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
          <p className="text-sm text-text-secondary">{agencies.length} agência(s)</p>
        </div>
        <Link href="/agencias/novo" className="btn-primary">
          + Nova agência
        </Link>
      </div>

      {agencies.length === 0 ? (
        <div className="card p-10 text-center text-text-secondary">
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
              <h2 className="font-semibold text-accent-primary">{a.nome}</h2>
              {a.contatoNome && (
                <p className="text-sm text-text-secondary">{a.contatoNome}</p>
              )}
              <p className="mt-3 text-sm text-text-secondary">
                {a._count.clientes} cliente(s) vinculado(s)
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
