import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateClient } from "@/lib/actions/clients";
import { getMetaAdAccounts } from "@/lib/meta";
import { ClientForm } from "@/components/client-form";

function toDateInput(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export default async function EditarClientePage({
  params,
}: {
  params: { id: string };
}) {
  const [client, agencies, users, services, metaAdAccounts] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.id },
      include: { servicos: true, contatos: true },
    }),
    prisma.partnerAgency.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, nome: true },
      orderBy: { nome: "asc" },
    }),
    prisma.service.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, parentId: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    }),
    getMetaAdAccounts(),
  ]);

  if (!client) notFound();

  const action = updateClient.bind(null, client.id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/clientes/${client.id}`}
          className="text-sm text-brand-700 hover:underline"
        >
          ← Voltar para o cliente
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Editar cliente</h1>
      </div>

      <ClientForm
        action={action}
        agencies={agencies}
        users={users}
        services={services}
        metaAdAccounts={metaAdAccounts}
        submitLabel="Salvar alterações"
        cancelHref={`/clientes/${client.id}`}
        values={{
          nomeRazaoSocial: client.nomeRazaoSocial,
          cnpj: client.cnpj,
          nicho: client.nicho,
          cidade: client.cidade,
          estado: client.estado,
          tipoRelacao: client.tipoRelacao,
          partnerAgencyId: client.partnerAgencyId,
          responsavelId: client.responsavelId,
          status: client.status,
          categoria: client.categoria,
          dataInicioContrato: toDateInput(client.dataInicioContrato),
          dataFimContrato: toDateInput(client.dataFimContrato),
          valorMensal: client.valorMensal ? String(client.valorMensal) : "",
          custoMensal: client.custoMensal ? String(client.custoMensal) : "",
          diaVencimento:
            client.diaVencimento != null ? String(client.diaVencimento) : "",
          possuiHospedagem: client.possuiHospedagem,
          dataRenovacao: toDateInput(client.dataRenovacao),
          valorRenovacao: client.valorRenovacao
            ? String(client.valorRenovacao)
            : "",
          metaAdAccountId: client.metaAdAccountId,
          observacoes: client.observacoes,
          servicos: client.servicos.map((s) => s.serviceId),
          contatos: client.contatos.map((c) => ({ tipo: c.tipo, valor: c.valor })),
        }}
      />
    </div>
  );
}
