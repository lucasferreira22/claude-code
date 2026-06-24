"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { addNote } from "@/lib/actions/clients";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn-primary" disabled={pending}>
      {pending ? "Salvando..." : "Adicionar nota"}
    </button>
  );
}

export function NoteForm({ clientId }: { clientId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const action = addNote.bind(null, clientId);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
      className="space-y-2"
    >
      <textarea
        name="conteudo"
        rows={3}
        required
        placeholder="Registrar interação, ligação, reunião..."
        className="input"
      />
      <SubmitButton />
    </form>
  );
}
