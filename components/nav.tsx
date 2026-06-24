"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/painel", label: "Painel" },
  { href: "/clientes", label: "Clientes" },
  { href: "/cobrancas", label: "Cobranças" },
  { href: "/financeiro", label: "Financeiro" },
  { href: "/agencias", label: "Agências Parceiras" },
  { href: "/importar", label: "Importar CSV" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
