"use client";

import { useFormStatus } from "react-dom";

function Inner({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-danger" disabled={pending}>
      {pending ? "Excluindo..." : label}
    </button>
  );
}

export function DeleteButton({
  action,
  label = "Excluir",
  confirmMessage,
}: {
  action: () => Promise<void>;
  label?: string;
  confirmMessage: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      <Inner label={label} />
    </form>
  );
}
