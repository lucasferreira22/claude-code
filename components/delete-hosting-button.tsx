"use client";

import { removeHosting } from "@/lib/actions/hosting";

// Remove a hospedagem de um cliente (some da aba Hospedagens). Espelha o
// botão "Excluir" das cobranças recorrentes mensais.
export function DeleteHostingButton({
  clientId,
  clienteNome,
}: {
  clientId: string;
  clienteNome: string;
}) {
  const excluir = removeHosting.bind(null, clientId);

  return (
    <form
      action={excluir}
      onSubmit={(e) => {
        if (
          !confirm(
            `Excluir a hospedagem de ${clienteNome}? A data e o valor da renovação serão apagados e ela sai do faturamento.`
          )
        )
          e.preventDefault();
      }}
    >
      <button
        type="submit"
        title="Excluir hospedagem"
        className="btn-secondary text-status-error"
      >
        Excluir
      </button>
    </form>
  );
}
