"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
            className={`whitespace-nowrap rounded-button px-3 py-2 text-sm font-medium transition-all duration-200 md:w-full ${
              active
                ? "bg-accent-subtle text-accent-primary"
                : "text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
