"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions/clients";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  SERVICO_LABELS,
  SERVICO_ORDER,
  CATEGORIA_LABELS,
  CATEGORIA_ORDER,
} from "@/lib/labels";

export type ClientFormValues = {
  nomeRazaoSocial?: string;
  cnpj?: string | null;
  nicho?: string | null;
  cidade?: string | null;
  estado?: string | null;
  tipoRelacao?: "DIRETO" | "PARCERIA";
  partnerAgencyId?: string | null;
  responsavelId?: string | null;
  status?: string;
  categoria?: string;
  dataInicioContrato?: string | null;
  dataFimContrato?: string | null;
  valorMensal?: string | null;
  observacoes?: string | null;
  servicos?: string[];
  contatos?: { tipo: string; valor: string }[];
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Salvando..." : label}
    </button>
  );
}

export function ClientForm({
  action,
  agencies,
  users,
  values,
  submitLabel,
  cancelHref,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  agencies: { id: string; nome: string }[];
  users: { id: string; nome: string }[];
  values?: ClientFormValues;
  submitLabel: string;
  cancelHref: string;
}) {
  const [state, formAction] = useFormState(action, undefined);
  const [tipoRelacao, setTipoRelacao] = useState(values?.tipoRelacao ?? "DIRETO");

  const contatoValor = (tipo: string) =>
    values?.contatos?.find((c) => c.tipo === tipo)?.valor ?? "";

  return (
    <form action={formAction} className="space-y-6">
      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Dados do cliente
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome / Razão social *</label>
            <input
              name="nomeRazaoSocial"
              required
              defaultValue={values?.nomeRazaoSocial ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label">CNPJ</label>
            <input name="cnpj" defaultValue={values?.cnpj ?? ""} className="input" />
          </div>
          <div>
            <label className="label">Nicho / Segmento</label>
            <input
              name="nicho"
              defaultValue={values?.nicho ?? ""}
              placeholder="Clínica, e-commerce, advocacia..."
              className="input"
            />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input
              name="cidade"
              defaultValue={values?.cidade ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label">Estado (UF)</label>
            <input
              name="estado"
              maxLength={2}
              defaultValue={values?.estado ?? ""}
              className="input uppercase"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Relação e contrato
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Tipo de relação *</label>
            <select
              name="tipoRelacao"
              value={tipoRelacao}
              onChange={(e) =>
                setTipoRelacao(e.target.value as "DIRETO" | "PARCERIA")
              }
              className="input"
            >
              <option value="DIRETO">Cliente Direto</option>
              <option value="PARCERIA">Cliente via Parceria</option>
            </select>
          </div>

          {tipoRelacao === "PARCERIA" && (
            <div>
              <label className="label">Agência parceira *</label>
              <select
                name="partnerAgencyId"
                defaultValue={values?.partnerAgencyId ?? ""}
                className="input"
              >
                <option value="">Selecione...</option>
                {agencies.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
              {agencies.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Nenhuma agência cadastrada.{" "}
                  <Link href="/agencias/novo" className="underline">
                    Cadastrar agência
                  </Link>
                </p>
              )}
            </div>
          )}

          <div>
            <label className="label">Status *</label>
            <select
              name="status"
              defaultValue={values?.status ?? "LEAD"}
              className="input"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Categoria *</label>
            <select
              name="categoria"
              defaultValue={values?.categoria ?? "RECORRENTE"}
              className="input"
            >
              {CATEGORIA_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABELS[c]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Responsável interno</label>
            <select
              name="responsavelId"
              defaultValue={values?.responsavelId ?? ""}
              className="input"
            >
              <option value="">—</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Data início do contrato</label>
            <input
              type="date"
              name="dataInicioContrato"
              defaultValue={values?.dataInicioContrato ?? ""}
              className="input"
            />
          </div>
          <div>
            <label className="label">Data fim do contrato</label>
            <input
              type="date"
              name="dataFimContrato"
              defaultValue={values?.dataFimContrato ?? ""}
              className="input"
            />
          </div>

          <div>
            <label className="label">Valor mensal (R$)</label>
            <input
              name="valorMensal"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={values?.valorMensal ?? ""}
              className="input"
            />
          </div>
        </div>

        <div>
          <span className="label">Serviços contratados</span>
          <div className="flex flex-wrap gap-4">
            {SERVICO_ORDER.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="servicos"
                  value={s}
                  defaultChecked={values?.servicos?.includes(s)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                {SERVICO_LABELS[s]}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Contatos
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="label">WhatsApp</label>
            <input
              name="contato_WHATSAPP"
              defaultValue={contatoValor("WHATSAPP")}
              className="input"
            />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input
              name="contato_TELEFONE"
              defaultValue={contatoValor("TELEFONE")}
              className="input"
            />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input
              name="contato_EMAIL"
              type="email"
              defaultValue={contatoValor("EMAIL")}
              className="input"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Observações
        </h2>
        <textarea
          name="observacoes"
          rows={4}
          defaultValue={values?.observacoes ?? ""}
          className="input"
          placeholder="Notas livres sobre o cliente..."
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
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
