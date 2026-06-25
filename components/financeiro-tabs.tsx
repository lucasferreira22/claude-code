"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/financeiro", label: "Resumo" },
  { href: "/financeiro/cobrancas", label: "Cobranças" },
  { href: "/financeiro/hospedagens", label: "Hospedagens" },
];

export function FinanceiroTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-gray-200">
      {tabs.map((tab) => {
        // "Resumo" só fica ativo no /financeiro exato (senão casaria com tudo).
        const active =
          tab.href === "/financeiro"
            ? pathname === "/financeiro"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
