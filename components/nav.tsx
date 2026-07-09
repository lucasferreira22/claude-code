"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Ícone por rota (linha, herda a cor do texto).
const ICONS: Record<string, React.ReactNode> = {
  "/painel": (
    <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h3A1.5 1.5 0 0 1 10 5.5v3A1.5 1.5 0 0 1 8.5 10h-3A1.5 1.5 0 0 1 4 8.5v-3ZM14 5.5A1.5 1.5 0 0 1 15.5 4h3A1.5 1.5 0 0 1 20 5.5v3A1.5 1.5 0 0 1 18.5 10h-3A1.5 1.5 0 0 1 14 8.5v-3ZM4 15.5A1.5 1.5 0 0 1 5.5 14h3A1.5 1.5 0 0 1 10 15.5v3A1.5 1.5 0 0 1 8.5 20h-3A1.5 1.5 0 0 1 4 18.5v-3ZM14 15.5A1.5 1.5 0 0 1 15.5 14h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3a1.5 1.5 0 0 1-1.5-1.5v-3Z" />
  ),
  "/clientes": (
    <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 19a6 6 0 0 1 12 0M16 11a3 3 0 1 0 0-6M21 19a5.5 5.5 0 0 0-3.5-5.1" />
  ),
  "/comercial": (
    <path d="M5 4v16M5 5h5v9H5zM12 5h5v6h-5zM12 5v6" />
  ),
  "/tarefas": (
    <path d="M9 5h6a1 1 0 0 1 1 1v0a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v0a1 1 0 0 1 1-1ZM7 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1M8.5 12.5l2 2 4-4" />
  ),
  "/financeiro": (
    <path d="M3 7h18v10H3zM3 10h18M7 14h2M12 14h5" />
  ),
  "/servicos": (
    <path d="M14 6h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4M9 6V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1" />
  ),
  "/agencias": (
    <path d="M4 20V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14M14 20v-9a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v9M3 20h18M7 8h3M7 12h3M7 16h3" />
  ),
};

const links = [
  { href: "/painel", label: "Painel" },
  { href: "/clientes", label: "Clientes" },
  { href: "/comercial", label: "Comercial" },
  { href: "/tarefas", label: "Tarefas" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/servicos", label: "Serviços" },
  { href: "/agencias", label: "Agências Parceiras" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            className={`nav-link flex items-center gap-2.5 whitespace-nowrap rounded-button px-3 py-2 text-sm font-medium transition-all duration-200 md:w-full ${
              active
                ? "bg-accent-subtle text-accent-primary"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {ICONS[link.href]}
            </svg>
            <span className="sidebar-label">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
