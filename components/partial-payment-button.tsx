"use client";

import { useState } from "react";

// Botão "Parcial": abre um campo para informar quanto foi recebido da
// cobrança. O restante continua pendente. Serve tanto para as cobranças
// recorrentes quanto para as avulsas — a action já vem "amarrada" pelo pai.
export function PartialPaymentButton({
  action,
  clienteNome,
  valorTotal,
  valorPago,
}: {
  action: (formData: FormData) => Promise<void>;
  clienteNome: string;
  // Formatados em pt-BR ("1.200,00" / "300,00").
  valorTotal: string;
  valorPago: string;
}) {
  const [aberto, setAberto] = useState(false);

  async function submit(formData: FormData) {
    await action(formData);
    setAberto(false);
  }

  return (
    <>
      <button
        type="button"
        className="btn-secondary"
        title="Registrar pagamento parcial"
        onClick={() => setAberto(true)}
      >
        Parcial
      </button>

      {aberto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center"
          onClick={() => setAberto(false)}
        >
          <div
            className="card w-full max-w-sm p-6 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-bold">Pagamento parcial</h2>
            <p className="mb-4 text-sm text-text-secondary">
              {clienteNome} · total R$ {valorTotal}
            </p>

            <form action={submit} className="space-y-4">
              <div>
                <label className="label">Valor recebido (R$)</label>
                <input
                  type="text"
                  name="valorPago"
                  required
                  autoFocus
                  inputMode="decimal"
                  defaultValue={valorPago}
                  placeholder="0,00"
                  className="input"
                />
                <p className="mt-1 text-xs text-text-muted">
                  O restante continua pendente. Se informar o valor total, a
                  cobrança é quitada.
                </p>
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
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
