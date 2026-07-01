"use client";

import { useState } from "react";
import { createCustomCharge } from "@/lib/actions/custom-charges";

type Cliente = { id: string; nomeRazaoSocial: string };

// Formulário de nova cobrança avulsa. Fica escondido atrás do botão "+ Nova
// cobrança"; ao escolher "Recorrente", revela o seletor de periodicidade.
export function CustomChargeForm({
  categoryId,
  clientes,
}: {
  categoryId: string;
  clientes: Cliente[];
}) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<"PONTUAL" | "RECORRENTE">("RECORRENTE");

  async function submit(formData: FormData) {
    await createCustomCharge(formData);
    setAberto(false);
    setTipo("RECORRENTE");
  }

  if (!aberto) {
    return (
      <button className="btn-primary" onClick={() => setAberto(true)}>
        + Nova cobrança
      </button>
    );
  }

  return (
    <form action={submit} className="card space-y-4 p-5">
      <input type="hidden" name="categoryId" value={categoryId} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Cliente</label>
          <select name="clientId" required defaultValue="" className="input">
            <option value="" disabled>
              Selecione…
            </option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nomeRazaoSocial}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Descrição (opcional)</label>
          <input
            type="text"
            name="descricao"
            placeholder="Ex.: Criação de landing page"
            className="input"
          />
        </div>

        <div>
          <label className="label">Valor (R$)</label>
          <input
            type="text"
            name="valor"
            required
            inputMode="decimal"
            placeholder="0,00"
            className="input"
          />
        </div>

        <div>
          <label className="label">1º vencimento</label>
          <input type="date" name="primeiroVencimento" required className="input" />
        </div>

        <div>
          <label className="label">Tipo</label>
          <select
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "PONTUAL" | "RECORRENTE")}
            className="input"
          >
            <option value="RECORRENTE">Recorrente</option>
            <option value="PONTUAL">Pontual (cobra uma vez)</option>
          </select>
        </div>

        {tipo === "RECORRENTE" && (
          <div>
            <label className="label">Periodicidade</label>
            <select name="recorrencia" defaultValue="MENSAL" className="input">
              <option value="MENSAL">Mensal</option>
              <option value="TRIMESTRAL">Trimestral</option>
              <option value="SEMESTRAL">Semestral</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setAberto(false)}
        >
          Cancelar
        </button>
        <button type="submit" className="btn-primary">
          Salvar cobrança
        </button>
      </div>
    </form>
  );
}
