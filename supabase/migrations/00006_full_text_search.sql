-- Migration 00006: Postgres Full-Text Search on Products

-- Add generated tsvector column for name and description
ALTER TABLE public.products
ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english', COALESCE(name, '') || ' ' || COALESCE(description, ''))
) STORED;

-- Create GIN index for full-text search
CREATE INDEX IF NOT EXISTS products_fts_idx ON public.products USING gin(fts);
