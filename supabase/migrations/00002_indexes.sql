-- Migration 00002: Indexes

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);

-- Note: products.slug already has an implicit unique index due to the UNIQUE constraint in table definition.
-- We can also explicitly create an index if we want to ensure custom index settings, but Postgres handles this automatically.
