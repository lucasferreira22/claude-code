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

  const action = updateService.bind(null, service.id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/servicos" className="text-sm text-brand-700 hover:underline">
          ← Voltar para serviços
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar serviço</h1>
      </div>

      <ServiceForm
        action={action}
        values={{
          nome: service.nome,
          descricao: service.descricao,
          ativo: service.ativo,
        }}
      />
    </div>
  );
}
