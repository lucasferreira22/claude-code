"use client";

import { useRef } from "react";
import { updateClientStatus } from "@/lib/actions/clients";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/labels";
import type { ClientStatus } from "@prisma/client";

export function StatusSelect({
  clientId,
  current,
}: {
  clientId: string;
  current: ClientStatus;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = updateClientStatus.bind(null, clientId);

  return (
    <form ref={formRef} action={action}>
      <select
        name="status"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        className="input"
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </form>
  );
}
