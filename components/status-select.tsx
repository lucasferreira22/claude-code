"use client";

import { useRef } from "react";
import { updateClientStage } from "@/lib/actions/clients";
import type { StageLite } from "@/lib/labels";

// Seletor da etapa do funil no detalhe do cliente (salva ao trocar).
export function StatusSelect({
  clientId,
  current,
  stages,
}: {
  clientId: string;
  current: string | null;
  stages: StageLite[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = updateClientStage.bind(null, clientId);

  return (
    <form ref={formRef} action={action}>
      <select
        name="stageId"
        defaultValue={current ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
        className="input"
      >
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nome}
          </option>
        ))}
      </select>
    </form>
  );
}
