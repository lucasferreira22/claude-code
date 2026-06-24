// Campos do sistema para os quais o usuário pode mapear colunas do CSV.
// Mantido fora do arquivo "use server" para poder exportar constantes/tipos
// e ser importado tanto pelo client (wizard) quanto pelo server (action).

export const IMPORT_FIELDS = [
  { key: "nomeRazaoSocial", label: "Nome / Razão social", required: true },
  { key: "nicho", label: "Nicho / Segmento", required: false },
  { key: "tipoRelacao", label: "Tipo (Direto / Parceria)", required: false },
  { key: "nomeAgencia", label: "Agência parceira (nome)", required: false },
  { key: "servicos", label: "Serviços (Meta/Google/Outros)", required: false },
  { key: "status", label: "Status", required: false },
  { key: "dataInicioContrato", label: "Data início do contrato", required: false },
  { key: "valorMensal", label: "Valor mensal", required: false },
  { key: "responsavelNome", label: "Responsável interno (nome)", required: false },
  { key: "contatoTelefone", label: "Telefone", required: false },
  { key: "contatoEmail", label: "E-mail", required: false },
  { key: "contatoWhatsapp", label: "WhatsApp", required: false },
  { key: "observacoes", label: "Observações", required: false },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];

export type ImportRow = Partial<Record<ImportFieldKey, string>>;

export type ImportResult = {
  created: number;
  skipped: number;
  errors: { linha: number; mensagem: string }[];
};
