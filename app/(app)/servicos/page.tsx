import { prisma } from "@/lib/prisma";
import { ServiceManager } from "@/components/service-manager";

export default async function ServicosPage() {
  const services = await prisma.service.findMany({
    orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    select: {
      id: true,
      nome: true,
      descricao: true,
      ativo: true,
      parentId: true,
      _count: { select: { clientes: true } },
    },
  });

  // Categorias = itens de topo (sem pai), usados como opção de agrupamento.
  const categorias = services
    .filter((s) => !s.parentId)
    .map((s) => ({ id: s.id, nome: s.nome }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Serviços</h1>
        <p className="text-sm text-text-secondary">
          Catálogo de serviços da agência. Os serviços ativos aparecem no
          cadastro de clientes.
        </p>
      </div>

      <ServiceManager
        categorias={categorias}
        services={services.map((s) => ({
          id: s.id,
          nome: s.nome,
          descricao: s.descricao,
          ativo: s.ativo,
          parentId: s.parentId,
          clientes: s._count.clientes,
        }))}
      />
    </div>
  );
}
