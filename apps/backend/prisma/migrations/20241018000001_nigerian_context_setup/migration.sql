-- Migration to set up Nigerian context for food ordering system
-- This migration updates payment methods and currency for Nigerian market

BEGIN;

-- Update default currency back to NGN (Nigerian Naira)
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'NGN';

-- Add Nigerian payment methods to enum if not already present
-- First check if we need to add any new payment methods
DO $$
BEGIN
    -- Add BANK_TRANSFER and MOBILE_MONEY if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BANK_TRANSFER' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentMethod')) THEN
        ALTER TYPE "PaymentMethod" ADD VALUE 'BANK_TRANSFER';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MOBILE_MONEY' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'PaymentMethod')) THEN
        ALTER TYPE "PaymentMethod" ADD VALUE 'MOBILE_MONEY';
    END IF;
END $$;

-- Update system settings for Nigerian context
INSERT INTO "system_settings" ("id", "key", "value", "createdAt", "updatedAt") 
VALUES 
    (gen_random_uuid(), 'currency', 'NGN', NOW(), NOW()),
    (gen_random_uuid(), 'timezone', 'Africa/Lagos', NOW(), NOW()),
    (gen_random_uuid(), 'country', 'Nigeria', NOW(), NOW())
ON CONFLICT ("key") DO UPDATE SET 
    "value" = EXCLUDED."value",
    "updatedAt" = NOW();

-- Update restaurant settings for Nigerian context
INSERT INTO "system_settings" ("id", "key", "value", "createdAt", "updatedAt") 
VALUES 
    (gen_random_uuid(), 'restaurant_name', 'Jollof Palace', NOW(), NOW()),
    (gen_random_uuid(), 'restaurant_phone', '+234-801-234-5678', NOW(), NOW()),
    (gen_random_uuid(), 'restaurant_address', 'Victoria Island, Lagos, Nigeria', NOW(), NOW()),
    (gen_random_uuid(), 'tax_rate', '0.075', NOW(), NOW()),
    (gen_random_uuid(), 'delivery_fee', '50000', NOW(), NOW()),
    (gen_random_uuid(), 'minimum_order', '100000', NOW(), NOW()),
    (gen_random_uuid(), 'operating_hours', '{"open": "09:00", "close": "22:00"}', NOW(), NOW()),
    (gen_random_uuid(), 'is_open', 'true', NOW(), NOW())
ON CONFLICT ("key") DO UPDATE SET 
    "value" = EXCLUDED."value",
    "updatedAt" = NOW();

COMMIT;