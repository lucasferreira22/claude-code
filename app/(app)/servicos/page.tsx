import { prisma } from "@/lib/prisma";
import { ServiceManager } from "@/components/service-manager";

export default async function ServicosPage() {
  const services = await prisma.service.findMany({
    orderBy: [{ ativo: "desc" }, { ordem: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      descricao: true,
      ativo: true,
      _count: { select: { clientes: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Serviços</h1>
        <p className="text-sm text-gray-500">
          Catálogo de serviços da agência. Os serviços ativos aparecem no
          cadastro de clientes.
        </p>
      </div>

      <ServiceManager
        services={services.map((s) => ({
          id: s.id,
          nome: s.nome,
          descricao: s.descricao,
          ativo: s.ativo,
          clientes: s._count.clientes,
        }))}
      />
    </div>
  );
}
