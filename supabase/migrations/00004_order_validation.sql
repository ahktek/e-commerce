-- Migration 00004: Order Validation and Creation Function

CREATE OR REPLACE FUNCTION public.create_order_from_cart(
    p_cart_id UUID,
    p_shipping_address_id UUID,
    p_billing_address_id UUID,
    p_shipping_cents INTEGER DEFAULT 0,
    p_tax_cents INTEGER DEFAULT 0,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_user_id UUID;
    v_cart_user_id UUID;
    v_cart_session_id TEXT;
    v_cart_status TEXT;
    v_subtotal_cents INTEGER := 0;
    v_total_cents INTEGER := 0;
    v_item RECORD;
    v_actual_unit_price INTEGER;
    v_snapshot_name TEXT;
BEGIN
    -- Get current authenticated user ID
    v_user_id := auth.uid();

    -- Fetch cart details
    SELECT user_id, session_id, status 
    INTO v_cart_user_id, v_cart_session_id, v_cart_status
    FROM public.carts
    WHERE id = p_cart_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cart not found';
    END IF;

    IF v_cart_status != 'active' THEN
        RAISE EXCEPTION 'Cart is not active';
    END IF;

    -- Authorize the action: user must own the cart, or it must be their guest session
    IF v_user_id IS NOT NULL THEN
        IF v_cart_user_id IS NULL OR v_cart_user_id != v_user_id THEN
            RAISE EXCEPTION 'Unauthorized: Cart does not belong to the authenticated user';
        END IF;
    ELSE
        IF p_session_id IS NULL OR v_cart_session_id IS NULL OR v_cart_session_id != p_session_id THEN
            RAISE EXCEPTION 'Unauthorized: Guest session does not match';
        END IF;
    END IF;

    -- Validate shipping and billing addresses if the user is authenticated
    IF v_user_id IS NOT NULL THEN
        IF p_shipping_address_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.addresses WHERE id = p_shipping_address_id AND user_id = v_user_id
        ) THEN
            RAISE EXCEPTION 'Invalid shipping address';
        END IF;
        IF p_billing_address_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.addresses WHERE id = p_billing_address_id AND user_id = v_user_id
        ) THEN
            RAISE EXCEPTION 'Invalid billing address';
        END IF;
    END IF;

    -- Validate item pricing and check stock
    FOR v_item IN 
        SELECT 
            ci.product_id, 
            ci.variant_id, 
            ci.quantity, 
            p.price_cents as product_price, 
            p.name as product_name, 
            p.stock_quantity as product_stock, 
            pv.price_delta_cents as variant_delta, 
            pv.variant_name, 
            pv.stock_quantity as variant_stock
        FROM public.cart_items ci
        JOIN public.products p ON ci.product_id = p.id
        LEFT JOIN public.product_variants pv ON ci.variant_id = pv.id
        WHERE ci.cart_id = p_cart_id
    LOOP
        -- Calculate actual price (base price + variant delta)
        v_actual_unit_price := v_item.product_price + COALESCE(v_item.variant_delta, 0);
        v_subtotal_cents := v_subtotal_cents + (v_actual_unit_price * v_item.quantity);

        -- Check stock
        IF v_item.variant_id IS NOT NULL THEN
            IF v_item.variant_stock < v_item.quantity THEN
                RAISE EXCEPTION 'Insufficient stock for variant % of product %', v_item.variant_name, v_item.product_name;
            END IF;
        ELSE
            IF v_item.product_stock < v_item.quantity THEN
                RAISE EXCEPTION 'Insufficient stock for product %', v_item.product_name;
            END IF;
        END IF;
    END LOOP;

    IF v_subtotal_cents = 0 THEN
        RAISE EXCEPTION 'Cart is empty';
    END IF;

    v_total_cents := v_subtotal_cents + p_shipping_cents + p_tax_cents;

    -- Insert Order
    INSERT INTO public.orders (
        user_id,
        status,
        subtotal_cents,
        tax_cents,
        shipping_cents,
        total_cents,
        shipping_address_id,
        billing_address_id
    ) VALUES (
        v_user_id,
        'pending',
        v_subtotal_cents,
        p_tax_cents,
        p_shipping_cents,
        v_total_cents,
        p_shipping_address_id,
        p_billing_address_id
    ) RETURNING id INTO v_order_id;

    -- Insert Order Items and Update Stock
    FOR v_item IN 
        SELECT 
            ci.product_id, 
            ci.variant_id, 
            ci.quantity, 
            p.price_cents as product_price, 
            p.name as product_name, 
            pv.price_delta_cents as variant_delta, 
            pv.variant_name
        FROM public.cart_items ci
        JOIN public.products p ON ci.product_id = p.id
        LEFT JOIN public.product_variants pv ON ci.variant_id = pv.id
        WHERE ci.cart_id = p_cart_id
    LOOP
        v_actual_unit_price := v_item.product_price + COALESCE(v_item.variant_delta, 0);
        
        IF v_item.variant_name IS NOT NULL THEN
            v_snapshot_name := v_item.product_name || ' (' || v_item.variant_name || ')';
        ELSE
            v_snapshot_name := v_item.product_name;
        END IF;

        -- Insert Order Item
        INSERT INTO public.order_items (
            order_id,
            product_id,
            variant_id,
            quantity,
            unit_price_cents,
            product_name_snapshot
        ) VALUES (
            v_order_id,
            v_item.product_id,
            v_item.variant_id,
            v_item.quantity,
            v_actual_unit_price,
            v_snapshot_name
        );

        -- Decrement Stock
        IF v_item.variant_id IS NOT NULL THEN
            UPDATE public.product_variants 
            SET stock_quantity = stock_quantity - v_item.quantity 
            WHERE id = v_item.variant_id;
        ELSE
            UPDATE public.products 
            SET stock_quantity = stock_quantity - v_item.quantity 
            WHERE id = v_item.product_id;
        END IF;
    END LOOP;

    -- Update Cart Status to Converted
    UPDATE public.carts 
    SET status = 'converted' 
    WHERE id = p_cart_id;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
