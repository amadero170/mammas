-- Migration: categoria (text) → categorias (text[])
-- Run this in Supabase SQL Editor.

-- 1. Add new array column
ALTER TABLE providers ADD COLUMN IF NOT EXISTS categorias text[] NOT NULL DEFAULT '{}';

-- 2. Migrate existing data: wrap single categoria value into array
UPDATE providers 
SET categorias = ARRAY[categoria] 
WHERE categoria IS NOT NULL AND categoria != '';

-- 3. Drop old column
ALTER TABLE providers DROP COLUMN IF EXISTS categoria;

-- 4. Create GIN index for efficient array searches (overlaps, contains)
CREATE INDEX IF NOT EXISTS providers_categorias_idx ON providers USING GIN (categorias);
