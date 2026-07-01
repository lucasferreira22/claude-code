-- Migração: Cobranças avulsas (abas/categorias personalizadas em Financeiro)
-- Rode UMA vez no Neon (branch de produção) ANTES de mergear.
-- Idempotente: pode rodar mais de uma vez sem erro.

-- 1) Enums novos --------------------------------------------------------------
DO $$
BEGIN
  CREATE TYPE "TipoCobranca" AS ENUM ('PONTUAL', 'RECORRENTE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "Recorrencia" AS ENUM ('MENSAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2) Categorias (abas) --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "charge_categories" (
  "id"           TEXT NOT NULL,
  "nome"         TEXT NOT NULL,
  "ordem"        INTEGER NOT NULL DEFAULT 0,
  "ativo"        BOOLEAN NOT NULL DEFAULT true,
  "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "charge_categories_pkey" PRIMARY KEY ("id")
);

-- 3) Cobranças avulsas --------------------------------------------------------
CREATE TABLE IF NOT EXISTS "custom_charges" (
  "id"                 TEXT NOT NULL,
  "categoryId"         TEXT NOT NULL,
  "clientId"           TEXT NOT NULL,
  "descricao"          TEXT,
  "valor"              DECIMAL(12,2) NOT NULL,
  "tipo"               "TipoCobranca" NOT NULL DEFAULT 'RECORRENTE',
  "recorrencia"        "Recorrencia",
  "primeiroVencimento" TIMESTAMP(3) NOT NULL,
  "ativo"              BOOLEAN NOT NULL DEFAULT true,
  "criadoEm"           TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm"       TIMESTAMP(3) NOT NULL,
  CONSTRAINT "custom_charges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "custom_charges_categoryId_idx" ON "custom_charges"("categoryId");
CREATE INDEX IF NOT EXISTS "custom_charges_clientId_idx" ON "custom_charges"("clientId");

-- 4) Status por competência ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "custom_charge_payments" (
  "id"           TEXT NOT NULL,
  "chargeId"     TEXT NOT NULL,
  "competencia"  TEXT NOT NULL,
  "status"       "PaymentStatus" NOT NULL DEFAULT 'PENDENTE',
  "pagoEm"       TIMESTAMP(3),
  "criadoEm"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "atualizadoEm" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "custom_charge_payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "custom_charge_payments_chargeId_competencia_key"
  ON "custom_charge_payments"("chargeId", "competencia");

-- 5) Foreign keys (idempotentes) ---------------------------------------------
DO $$
BEGIN
  ALTER TABLE "custom_charges"
    ADD CONSTRAINT "custom_charges_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "charge_categories"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "custom_charges"
    ADD CONSTRAINT "custom_charges_clientId_fkey"
    FOREIGN KEY ("clientId") REFERENCES "clients"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "custom_charge_payments"
    ADD CONSTRAINT "custom_charge_payments_chargeId_fkey"
    FOREIGN KEY ("chargeId") REFERENCES "custom_charges"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
