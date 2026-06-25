import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/actions/clients";
import { ClientForm } from "@/components/client-form";

export default async function NovoClientePage() {
  const [agencies, users, services] = await Promise.all([
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
      select: { id: true, nome: true },
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clientes" className="text-sm text-brand-700 hover:underline">
          ← Voltar para clientes
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Novo cliente</h1>
      </div>

      <ClientForm
        action={createClient}
        agencies={agencies}
        users={users}
        services={services}
        submitLabel="Cadastrar cliente"
        cancelHref="/clientes"
      />
    </div>
  );
}
