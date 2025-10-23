-- AlterEnum
-- Update PaymentMethod enum to support USA payment methods
BEGIN;

-- Create new enum with USA payment methods
CREATE TYPE "PaymentMethod_new" AS ENUM ('CARD', 'PAYPAL', 'APPLE_PAY', 'GOOGLE_PAY', 'ZELLE', 'CASH');

-- Update existing records to map old values to new ones
UPDATE "payments" SET "method" = 'CARD' WHERE "method" = 'BANK_TRANSFER';
UPDATE "payments" SET "method" = 'CARD' WHERE "method" = 'MOBILE_MONEY';

-- Alter the column to use the new enum
ALTER TABLE "payments" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");

-- Drop the old enum and rename the new one
DROP TYPE "PaymentMethod";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";

-- Update default currency from NGN to USD
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'USD';

-- Update existing records to use USD (this is a breaking change, use with caution)
-- UPDATE "payments" SET "currency" = 'USD' WHERE "currency" = 'NGN';

COMMIT;