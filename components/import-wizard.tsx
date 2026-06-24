"use client";

import { useState, useTransition } from "react";
import Papa from "papaparse";
import Link from "next/link";
import {
  IMPORT_FIELDS,
  type ImportFieldKey,
  type ImportRow,
  type ImportResult,
} from "@/lib/import-fields";
import { importClients } from "@/lib/actions/import";

const IGNORE = "__ignore__";

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

// Palpite automático de mapeamento por similaridade de nome de coluna.
function guessMapping(headers: string[]): Record<ImportFieldKey, string> {
  const map = {} as Record<ImportFieldKey, string>;
  const hints: Record<ImportFieldKey, string[]> = {
    nomeRazaoSocial: ["nome", "cliente", "razao", "empresa"],
    nicho: ["nicho", "segmento", "ramo"],
    tipoRelacao: ["tipo", "relacao", "origem"],
    nomeAgencia: ["agencia", "parceiro", "parceira"],
    servicos: ["servico", "produto", "trafego"],
    status: ["status", "situacao", "andamento"],
    dataInicioContrato: ["inicio", "data", "contrato"],
    valorMensal: ["valor", "mensal", "fee", "mensalidade"],
    responsavelNome: ["responsavel", "gestor", "atende"],
    contatoTelefone: ["telefone", "fone", "celular"],
    contatoEmail: ["email", "e-mail", "mail"],
    contatoWhatsapp: ["whats", "zap"],
    observacoes: ["obs", "observ", "nota"],
  };

  for (const field of IMPORT_FIELDS) {
    const match = headers.find((h) => {
      const nh = normalizeHeader(h);
      return hints[field.key].some((hint) => nh.includes(hint));
    });
    map[field.key] = match ?? IGNORE;
  }
  return map;
}

type RawRow = Record<string, string>;

export function ImportWizard() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<Record<ImportFieldKey, string>>(
    {} as Record<ImportFieldKey, string>
  );
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);

    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const fields = res.meta.fields ?? [];
        setHeaders(fields);
        setRows(res.data);
        setMapping(guessMapping(fields));
      },
    });
  }

  function buildRows(): ImportRow[] {
    return rows.map((raw) => {
      const out: ImportRow = {};
      for (const field of IMPORT_FIELDS) {
        const col = mapping[field.key];
        if (col && col !== IGNORE) {
          out[field.key] = raw[col] ?? "";
        }
      }
      return out;
    });
  }

  function handleImport() {
    const mapped = buildRows();
    startTransition(async () => {
      const res = await importClients(mapped);
      setResult(res);
    });
  }

  const nameMapped =
    mapping.nomeRazaoSocial && mapping.nomeRazaoSocial !== IGNORE;
  const previewRows = buildRows().slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Passo 1: upload */}
      <section className="card p-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          1. Selecione o arquivo CSV
        </h2>
        <p className="mb-3 text-sm text-gray-500">
          A primeira linha do arquivo deve conter os nomes das colunas.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="block text-sm"
        />
        {fileName && (
          <p className="mt-2 text-xs text-gray-400">
            {fileName} · {rows.length} linha(s) detectada(s)
          </p>
        )}
      </section>

      {headers.length > 0 && (
        <>
          {/* Passo 2: mapeamento */}
          <section className="card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              2. Revise o mapeamento de colunas
            </h2>
            <div className="space-y-2">
              {IMPORT_FIELDS.map((field) => (
                <div
                  key={field.key}
                  className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2"
                >
                  <span className="text-sm text-gray-700">
                    {field.label}
                    {field.required && (
                      <span className="text-red-500"> *</span>
                    )}
                  </span>
                  <select
                    value={mapping[field.key] ?? IGNORE}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [field.key]: e.target.value }))
                    }
                    className="input"
                  >
                    <option value={IGNORE}>— ignorar —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            {!nameMapped && (
              <p className="mt-3 text-sm text-amber-600">
                Mapeie a coluna do nome do cliente para continuar (campo
                obrigatório).
              </p>
            )}
          </section>

          {/* Passo 3: prévia */}
          <section className="card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
              3. Prévia (primeiras {previewRows.length} linhas)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-left text-gray-500">
                  <tr>
                    {IMPORT_FIELDS.filter(
                      (f) => mapping[f.key] && mapping[f.key] !== IGNORE
                    ).map((f) => (
                      <th key={f.key} className="px-2 py-2">
                        {f.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewRows.map((r, i) => (
                    <tr key={i}>
                      {IMPORT_FIELDS.filter(
                        (f) => mapping[f.key] && mapping[f.key] !== IGNORE
                      ).map((f) => (
                        <td key={f.key} className="px-2 py-2 text-gray-700">
                          {r[f.key] || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={handleImport}
                disabled={!nameMapped || isPending}
                className="btn-primary"
              >
                {isPending
                  ? "Importando..."
                  : `Importar ${rows.length} cliente(s)`}
              </button>
              <span className="text-xs text-gray-400">
                Linhas sem nome serão ignoradas.
              </span>
            </div>
          </section>
        </>
      )}

      {/* Resultado */}
      {result && (
        <section className="card p-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Resultado da importação
          </h2>
          <ul className="space-y-1 text-sm">
            <li className="text-green-700">
              {result.created} cliente(s) importado(s) com sucesso.
            </li>
            {result.skipped > 0 && (
              <li className="text-gray-500">
                {result.skipped} linha(s) ignorada(s) (sem nome).
              </li>
            )}
            {result.errors.length > 0 && (
              <li className="text-red-600">
                {result.errors.length} erro(s):
                <ul className="ml-4 list-disc">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      Linha {err.linha}: {err.mensagem}
                    </li>
                  ))}
                </ul>
              </li>
            )}
          </ul>
          {result.created > 0 && (
            <Link href="/clientes" className="btn-primary mt-4">
              Ver clientes importados
            </Link>
          )}
        </section>
      )}
    </div>
  );
}
