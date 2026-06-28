import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateService } from "@/lib/actions/services";
import { ServiceForm } from "@/components/service-form";

export default async function EditarServicoPage({
  params,
}: {
  params: { id: string };
}) {
  const service = await prisma.service.findUnique({ where: { id: params.id } });
  if (!service) notFound();

  // Categorias possíveis = itens de topo, exceto o próprio serviço.
  const categorias = (
    await prisma.service.findMany({
      where: { parentId: null, id: { not: service.id } },
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    })
  ).map((c) => ({ id: c.id, nome: c.nome }));

  const action = updateService.bind(null, service.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/servicos" className="text-sm text-accent-primary hover:underline">
          ← Voltar para serviços
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar serviço</h1>
      </div>

      <ServiceForm
        action={action}
        categorias={categorias}
        values={{
          nome: service.nome,
          descricao: service.descricao,
          ativo: service.ativo,
          parentId: service.parentId,
        }}
      />
    </div>
  );
}
