import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/painel");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="/logo-focus.svg"
            alt="Focus Digital"
            className="mb-3 h-12 w-auto dark:hidden"
          />
          <img
            src="/logo-focus-branco.svg"
            alt="Focus Digital"
            className="mb-3 hidden h-12 w-auto dark:block"
          />
          <p className="text-sm text-gray-500">CRM · Gestão de clientes</p>
        </div>
        <div className="card p-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
