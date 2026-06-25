import { FinanceiroTabs } from "@/components/financeiro-tabs";

// Agrupa Resumo, Cobranças e Hospedagens sob uma navegação por sub-abas.
export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <FinanceiroTabs />
      {children}
    </div>
  );
}
