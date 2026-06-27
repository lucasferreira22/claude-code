import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v === "" ? undefined : v));

const optionalDate = z
  .string()
  .optional()
  .transform((v) => (v && v !== "" ? new Date(v) : undefined));

const optionalDecimal = z
  .string()
  .optional()
  .transform((v) => {
    if (!v || v.trim() === "") return undefined;
    // aceita "1.234,56" ou "1234.56"
    const normalized = v.replace(/\./g, "").replace(",", ".");
    const n = Number(normalized);
    return Number.isNaN(n) ? undefined : n;
  });

// Dia do mês (1–31); valores fora da faixa viram undefined.
const optionalDayOfMonth = z
  .string()
  .optional()
  .transform((v) => {
    if (!v || v.trim() === "") return undefined;
    const n = Number(v.trim());
    return Number.isInteger(n) && n >= 1 && n <= 31 ? n : undefined;
  });

export const clientSchema = z.object({
  nomeRazaoSocial: z.string().trim().min(1, "Nome é obrigatório"),
  cnpj: optionalString,
  nicho: optionalString,
  cidade: optionalString,
  estado: optionalString,
  tipoRelacao: z.enum(["DIRETO", "PARCERIA"], {
    required_error: "Tipo de relação é obrigatório",
  }),
  partnerAgencyId: optionalString,
  responsavelId: optionalString,
  status: z.enum(["LEAD", "EM_NEGOCIACAO", "ATIVO", "PAUSADO", "ENCERRADO"]),
  categoria: z
    .enum(["RECORRENTE", "PONTUAL", "HOSPEDAGEM"])
    .default("RECORRENTE"),
  dataInicioContrato: optionalDate,
  dataFimContrato: optionalDate,
  valorMensal: optionalDecimal,
  custoMensal: optionalDecimal,
  diaVencimento: optionalDayOfMonth,
  possuiHospedagem: z.boolean().default(false),
  dataRenovacao: optionalDate,
  valorRenovacao: optionalDecimal,
  metaAdAccountId: optionalString,
  observacoes: optionalString,
  // IDs dos serviços do catálogo (tabela services).
  servicos: z.array(z.string()).default([]),
  contatos: z
    .array(
      z.object({
        tipo: z.enum(["TELEFONE", "EMAIL", "WHATSAPP"]),
        valor: z.string().trim().min(1),
      })
    )
    .default([]),
});

export type ClientInput = z.infer<typeof clientSchema>;

export const agencySchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
  contatoNome: optionalString,
  contatoEmail: optionalString,
  contatoTelefone: optionalString,
  observacoes: optionalString,
});

export type AgencyInput = z.infer<typeof agencySchema>;

// ---------------------------------------------------------------------------
// Lead vindo da landing page (focus-digital-site) pelo endpoint público
// /api/leads/intake. Captura o mínimo: quem é e como falar com a pessoa.
// Exige pelo menos uma forma de contato (e-mail ou telefone).
// ---------------------------------------------------------------------------
const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v !== "" ? v : undefined))
  .refine((v) => v === undefined || z.string().email().safeParse(v).success, {
    message: "E-mail inválido",
  });

export const leadIntakeSchema = z
  .object({
    nome: z.string().trim().min(1, "Nome é obrigatório"),
    email: optionalEmail,
    // Contato principal da landing: WhatsApp.
    whatsapp: optionalString,
    telefone: optionalString,
    // Nicho/segmento do negócio — vai para o campo dedicado Client.nicho.
    nicho: optionalString,
    // Site ou rede social da empresa (Instagram, site, etc.)
    site: optionalString,
    mensagem: optionalString,
  })
  .refine((d) => Boolean(d.email) || Boolean(d.whatsapp) || Boolean(d.telefone), {
    message: "Informe ao menos e-mail ou WhatsApp",
    path: ["email"],
  });

export type LeadIntakeInput = z.infer<typeof leadIntakeSchema>;
