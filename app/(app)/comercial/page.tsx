import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "@/components/kanban-board";

export default async function ComercialPage() {
  const clients = await prisma.client.findMany({
    select: {
      id: true,
      nomeRazaoSocial: true,
      status: true,
      categoria: true,
      valorMensal: true,
      responsavel: { select: { nome: true } },
      partnerAgency: { select: { nome: true } },
    },
    // Mais recentes no topo: ao mover um card de etapa, ele sobe para a
    // primeira posição da coluna e assim permanece após recarregar.
    orderBy: { atualizadoEm: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comercial</h1>
        <p className="text-sm text-text-secondary">
          Funil de {clients.length} cliente(s) · arraste os cards entre as
          etapas para mudar o status.
        </p>
      </div>

      <KanbanBoard
        initial={clients.map((c) => ({
          id: c.id,
          nomeRazaoSocial: c.nomeRazaoSocial,
          status: c.status,
          categoria: c.categoria,
          valorMensal: c.valorMensal ? Number(c.valorMensal) : null,
          responsavelNome: c.responsavel?.nome ?? null,
          partnerAgencyNome: c.partnerAgency?.nome ?? null,
        }))}
      />
    </div>
  );
}
