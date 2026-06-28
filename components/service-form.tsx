"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import type { ServiceActionState } from "@/lib/actions/services";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Salvando..." : "Salvar alterações"}
    </button>
  );
}

export function ServiceForm({
  action,
  values,
  categorias,
}: {
  action: (prev: ServiceActionState, formData: FormData) => Promise<ServiceActionState>;
  values: {
    nome: string;
    descricao: string | null;
    ativo: boolean;
    parentId: string | null;
  };
  categorias: { id: string; nome: string }[];
}) {
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="card space-y-4 p-6">
      <div>
        <label className="label">Nome do serviço *</label>
        <input
          name="nome"
          required
          defaultValue={values.nome}
          className="input"
        />
      </div>
      <div>
        <label className="label">Descrição</label>
        <textarea
          name="descricao"
          rows={3}
          defaultValue={values.descricao ?? ""}
          className="input"
          placeholder="O que está incluído (opcional)"
        />
      </div>
      <div>
        <label className="label">Categoria</label>
        <select
          name="parentId"
          defaultValue={values.parentId ?? ""}
          className="input"
        >
          <option value="">— Nenhuma (item de topo)</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={values.ativo}
          className="h-4 w-4 rounded border-border-default"
        />
        Ativo (aparece no cadastro de clientes)
      </label>

      {state?.error && <p className="text-sm text-status-error">{state.error}</p>}
      {state?.ok && <p className="text-sm text-status-success">{state.ok}</p>}

      <div className="flex gap-2">
        <SubmitButton />
        <Link href="/servicos" className="btn-secondary">
          Voltar
        </Link>
      </div>
    </form>
  );
}
