import Link from "next/link";
import { createAgency } from "@/lib/actions/agencies";
import { AgencyForm } from "@/components/agency-form";

export default function NovaAgenciaPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/agencias" className="text-sm text-accent-primary hover:underline">
          ← Voltar para agências
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Nova agência parceira</h1>
      </div>

      <AgencyForm
        action={createAgency}
        submitLabel="Cadastrar agência"
        cancelHref="/agencias"
      />
    </div>
  );
}
