"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions/clients";

export type AgencyFormValues = {
  nome?: string;
  contatoNome?: string | null;
  contatoEmail?: string | null;
  contatoTelefone?: string | null;
  observacoes?: string | null;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Salvando..." : label}
    </button>
  );
}

export function AgencyForm({
  action,
  values,
  submitLabel,
  cancelHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  values?: AgencyFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div className="card space-y-4 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome da agência *</label>
            <input
              name="nome"
              required
              defaultValue={values?.nome ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label">Contato (nome)</label>
            <input
              name="contatoNome"
              defaultValue={values?.contatoNome ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label">Contato (e-mail)</label>
            <input
              name="contatoEmail"
              type="email"
              defaultValue={values?.contatoEmail ?? ""}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Contato (telefone)</label>
            <input
              name="contatoTelefone"
              defaultValue={values?.contatoTelefone ?? ""}
              className="input"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Observações</label>
            <textarea
              name="observacoes"
              rows={3}
              defaultValue={values?.observacoes ?? ""}
              className="input"
            />
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-status-error" role="alert">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton label={submitLabel} />
        <Link href={cancelHref} className="btn-secondary">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
