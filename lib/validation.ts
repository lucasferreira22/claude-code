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
  dataRenovacao: optionalDate,
  valorRenovacao: optionalDecimal,
  observacoes: optionalString,
  servicos: z.array(z.enum(["META_ADS", "GOOGLE_ADS", "OUTROS"])).default([]),
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
