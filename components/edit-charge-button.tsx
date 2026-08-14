"use client";

import { useState } from "react";
import { updateCustomCharge } from "@/lib/actions/custom-charges";
import { RECORRENCIA_LABELS } from "@/lib/labels";
import type { Recorrencia, TipoCobranca } from "@prisma/client";

export type ChargeToEdit = {
  id: string;
  categoryId: string;
  clientId: string;
  clienteNome: string;
  descricao: string | null;
  // Já formatado em pt-BR ("700,00") para casar com o parser do formulário.
  valor: string;
  custo: string;
  tipo: TipoCobranca;
  recorrencia: Recorrencia | null;
  // "AAAA-MM-DD"
  primeiroVencimento: string;
};

const RECORRENCIAS: Recorrencia[] = [
  "MENSAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
];

// Botão "Editar" de uma cobrança avulsa: abre um formulário com os dados
// atuais para ajustar descrição, valor, vencimento e periodicidade.
export function EditChargeButton({ charge }: { charge: ChargeToEdit }) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoCobranca>(charge.tipo);

  const salvar = updateCustomCharge.bind(null, charge.id);

  async function submit(formData: FormData) {
    await salvar(formData);
    setAberto(false);
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          setTipo(charge.tipo);
          setAberto(true);
        }}
      >
        Editar
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => setAberto(false)}
        >
          <div
            className="card w-full max-w-lg p-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-bold">Editar cobrança</h2>
            <p className="mb-4 text-sm text-text-secondary">
              {charge.clienteNome}
            </p>

            <form action={submit} className="space-y-4">
              <input type="hidden" name="categoryId" value={charge.categoryId} />
              <input type="hidden" name="clientId" value={charge.clientId} />

              <div>
                <label className="label">Descrição</label>
                <input
                  type="text"
                  name="descricao"
                  defaultValue={charge.descricao ?? ""}
                  placeholder="Ex.: Criação de landing page"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Valor (R$)</label>
                  <input
                    type="text"
                    name="valor"
                    required
                    inputMode="decimal"
                    defaultValue={charge.valor}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Custo (R$) — opcional</label>
                  <input
                    type="text"
                    name="custo"
                    inputMode="decimal"
                    placeholder="0,00"
                    defaultValue={charge.custo}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Vencimento</label>
                  <input
                    type="date"
                    name="primeiroVencimento"
                    required
                    defaultValue={charge.primeiroVencimento}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">Tipo</label>
                  <select
                    name="tipo"
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoCobranca)}
                    className="input"
                  >
                    <option value="RECORRENTE">Recorrente</option>
                    <option value="PONTUAL">Pontual (cobra uma vez)</option>
                  </select>
                </div>

                {tipo === "RECORRENTE" && (
                  <div>
                    <label className="label">Periodicidade</label>
                    <select
                      name="recorrencia"
                      defaultValue={charge.recorrencia ?? "MENSAL"}
                      className="input"
                    >
                      {RECORRENCIAS.map((r) => (
                        <option key={r} value={r}>
                          {RECORRENCIA_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <p className="text-xs text-text-muted">
                Em cobranças recorrentes, o vencimento define o dia e o início do
                ciclo.
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAberto(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
