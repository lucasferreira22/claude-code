"use client";

import { useState } from "react";
import {
  renameChargeCategory,
  deleteChargeCategory,
} from "@/lib/actions/custom-charges";

// Renomear / excluir a aba (categoria) de cobrança.
export function ChargeCategoryActions({
  id,
  nome,
}: {
  id: string;
  nome: string;
}) {
  const [editando, setEditando] = useState(false);
  const renomear = renameChargeCategory.bind(null, id);
  const excluir = deleteChargeCategory.bind(null, id);

  if (editando) {
    return (
      <form
        action={async (fd) => {
          await renomear(fd);
          setEditando(false);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          name="nome"
          defaultValue={nome}
          autoFocus
          required
          className="input max-w-xs"
        />
        <button type="submit" className="btn-primary">
          Salvar
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setEditando(false)}
        >
          Cancelar
        </button>
      </form>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        className="btn-secondary"
        onClick={() => setEditando(true)}
      >
        Renomear
      </button>
      <form
        action={excluir}
        onSubmit={(e) => {
          if (
            !confirm(
              `Excluir a aba "${nome}" e todas as suas cobranças? Esta ação não pode ser desfeita.`
            )
          )
            e.preventDefault();
        }}
      >
        <button type="submit" className="btn-secondary text-status-error">
          Excluir aba
        </button>
      </form>
    </div>
  );
}
