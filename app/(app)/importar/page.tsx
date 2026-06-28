import { ImportWizard } from "@/components/import-wizard";

export default function ImportarPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Importar clientes (CSV)</h1>
        <p className="text-sm text-text-secondary">
          Migre sua planilha existente. Faça o upload, revise para quais campos
          cada coluna será mapeada e confirme.
        </p>
      </div>
      <ImportWizard />
    </div>
  );
}
