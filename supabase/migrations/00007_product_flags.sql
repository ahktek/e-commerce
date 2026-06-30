-- Migration 00007: Add Product Flags
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_new BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_limited_stock BOOLEAN NOT NULL DEFAULT false;
