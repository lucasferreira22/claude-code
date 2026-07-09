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
    <div className="min-h-screen bg-surface-page text-text-primary md:flex">
      {/* Barra lateral esquerda */}
      <aside className="z-10 flex flex-col border-b border-border-default bg-surface-card md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center px-5 py-4">
          <Link href="/painel" className="shrink-0">
            <img
              src="/logo-focus.svg"
              alt="Focus Digital"
              className="h-5 w-auto dark:hidden"
            />
            <img
              src="/logo-focus-branco.svg"
              alt="Focus Digital"
              className="hidden h-5 w-auto dark:block"
            />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <Nav />
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border-default px-4 py-3">
          <ThemeToggle />
          <PrivacyToggle />
          <span className="hidden truncate text-sm text-text-secondary sm:inline">
            {session.user.name ?? session.user.email}
          </span>
          <LogoutButton />
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="relative min-w-0 flex-1">
        <div className="pointer-events-none absolute inset-0 z-0 grid-bg-overlay opacity-60" />
        <main className="relative z-10 mx-auto max-w-[1400px] px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
