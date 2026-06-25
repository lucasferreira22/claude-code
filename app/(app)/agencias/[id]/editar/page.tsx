import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateAgency } from "@/lib/actions/agencies";
import { AgencyForm } from "@/components/agency-form";

export default async function EditarAgenciaPage({
  params,
}: {
  params: { id: string };
}) {
  const agency = await prisma.partnerAgency.findUnique({
    where: { id: params.id },
  });
  if (!agency) notFound();

  const action = updateAgency.bind(null, agency.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/agencias/${agency.id}`}
          className="text-sm text-brand-700 hover:underline"
        >
          ← Voltar para a agência
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar agência</h1>
      </div>

      <AgencyForm
        action={action}
        submitLabel="Salvar alterações"
        cancelHref={`/agencias/${agency.id}`}
        values={{
          nome: agency.nome,
          contatoNome: agency.contatoNome,
          contatoEmail: agency.contatoEmail,
          contatoTelefone: agency.contatoTelefone,
          observacoes: agency.observacoes,
        }}
      />
    </div>
  );
}
