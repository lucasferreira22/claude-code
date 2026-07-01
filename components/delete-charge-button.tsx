"use client";

import { deleteCustomCharge } from "@/lib/actions/custom-charges";

// Botão de excluir uma cobrança avulsa, com confirmação.
export function DeleteChargeButton({ id }: { id: string }) {
  const excluir = deleteCustomCharge.bind(null, id);
  return (
    <form
      action={excluir}
      onSubmit={(e) => {
        if (!confirm("Excluir esta cobrança?")) e.preventDefault();
      }}
    >
      <button
        type="submit"
        title="Excluir cobrança"
        className="btn-secondary text-status-error"
      >
        Excluir
      </button>
    </form>
  );
}
