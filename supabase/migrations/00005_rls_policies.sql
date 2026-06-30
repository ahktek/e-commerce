-- Migration 00005: Row Level Security (RLS) Policies

-- Helper function to check if the current user is an admin.
-- Runs with SECURITY DEFINER to bypass RLS when querying the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
        FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Table Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_profiles ON public.profiles
    FOR SELECT
    USING (auth.uid() = id OR public.is_admin());

CREATE POLICY update_profiles ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND (role = 'customer' OR public.is_admin()));

-- 2. Categories Table Policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_categories ON public.categories
    FOR SELECT
    USING (true); -- Public read-only access

CREATE POLICY modify_categories ON public.categories
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. Products Table Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_products ON public.products
    FOR SELECT
    USING (is_active = true OR public.is_admin());

CREATE POLICY modify_products ON public.products
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. Product Variants Table Policies
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_product_variants ON public.product_variants
    FOR SELECT
    USING (true); -- Public read-only access for variant information

CREATE POLICY modify_product_variants ON public.product_variants
    FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. Addresses Table Policies
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_own_addresses ON public.addresses
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 6. Reviews Table Policies
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_reviews ON public.reviews
    FOR SELECT
    USING (true); -- Public read access

CREATE POLICY insert_reviews ON public.reviews
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND 
        EXISTS (
            SELECT 1 
            FROM public.orders o
            JOIN public.order_items oi ON o.id = oi.order_id
            WHERE o.user_id = auth.uid() 
              AND o.status = 'delivered' 
              AND oi.product_id = reviews.product_id
        )
    );

CREATE POLICY update_delete_own_reviews ON public.reviews
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY delete_own_reviews ON public.reviews
    FOR DELETE
    USING (auth.uid() = user_id);

-- 7. Carts Table Policies
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_carts ON public.carts
    FOR ALL
    USING (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
        (auth.uid() IS NULL AND session_id IS NOT NULL)
    )
    WITH CHECK (
        (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
        (auth.uid() IS NULL AND session_id IS NOT NULL)
    );

-- 8. Cart Items Table Policies
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_cart_items ON public.cart_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM public.carts 
            WHERE carts.id = cart_items.cart_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM public.carts 
            WHERE carts.id = cart_items.cart_id
        )
    );

-- 9. Orders Table Policies
-- Note: No INSERT policies are defined. Direct client inserts are blocked.
-- Insertion is allowed only via the server-side SECURITY DEFINER function `create_order_from_cart`.
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_orders ON public.orders
    FOR SELECT
    USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY update_orders ON public.orders
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 10. Order Items Table Policies
-- Note: No INSERT/UPDATE/DELETE policies are defined. Direct client mutations are blocked.
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_order_items ON public.order_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM public.orders 
            WHERE orders.id = order_items.order_id
        )
    );

-- 11. Wishlists Table Policies
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY access_own_wishlist ON public.wishlists
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
