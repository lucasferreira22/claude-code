import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Nav } from "@/components/nav";
import { LogoutButton } from "@/components/logout-button";
import { PrivacyToggle } from "@/components/privacy-toggle";
import { ThemeToggle } from "@/components/theme-toggle";

// App autenticado: nada é pré-renderizado estaticamente (depende de sessão + DB).
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/painel" className="shrink-0">
              <img
                src="/logo-focus.svg"
                alt="Focus Digital"
                className="h-7 w-auto dark:hidden"
              />
              <img
                src="/logo-focus-branco.svg"
                alt="Focus Digital"
                className="hidden h-7 w-auto dark:block"
              />
            </Link>
            <Nav />
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <PrivacyToggle />
            <span className="hidden text-sm text-gray-500 sm:inline">
              {session.user.name ?? session.user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
