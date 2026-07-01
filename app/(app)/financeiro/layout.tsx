import { prisma } from "@/lib/prisma";
import { FinanceiroTabs } from "@/components/financeiro-tabs";

// Agrupa Resumo, Cobranças, Hospedagens e as abas de cobranças avulsas
// (criadas pelo usuário) sob uma navegação por sub-abas.
export default async function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categorias = await prisma.chargeCategory.findMany({
    where: { ativo: true },
    orderBy: [{ ordem: "asc" }, { criadoEm: "asc" }],
    select: { id: true, nome: true },
  });

  return (
    <div className="space-y-6">
      <FinanceiroTabs categorias={categorias} />
      {children}
    </div>
  );
}
