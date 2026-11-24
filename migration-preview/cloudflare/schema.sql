-- PaperMatte Store migration preview schema.
-- Safe to apply ONLY to a newly-created D1 database, never to Supabase.
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  price REAL NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'tablets',
  description TEXT,
  image_url TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  product_type TEXT NOT NULL DEFAULT 'product',
  created_at TEXT,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_products_active_created
  ON products (is_active, product_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_category
  ON products (category);
