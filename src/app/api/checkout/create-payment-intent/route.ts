import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-01-27.accredited-backpacks' as any
})

export async function POST(request: Request) {
  try {
    const { cartId, shippingAddressId } = await request.json()
    if (!cartId) {
      return NextResponse.json({ error: 'Missing cart ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Fetch cart items
    const { data: items, error } = await supabase
      .from('cart_items')
      .select('product_id, variant_id, quantity, products(price_cents, name, stock_quantity), product_variants(price_delta_cents, stock_quantity)')
      .eq('cart_id', cartId)

    if (error) throw error
    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    // 2. Validate price and stock server-side
    let subtotalCents = 0
    for (const item of (items as any[])) {
      const basePrice = item.products?.price_cents || 0
      const delta = item.product_variants?.price_delta_cents || 0
      const currentPrice = basePrice + delta

      subtotalCents += currentPrice * item.quantity

      // Check stock
      const stockAvailable = item.variant_id 
        ? item.product_variants?.stock_quantity 
        : item.products?.stock_quantity

      if (stockAvailable < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for product: ${item.products?.name}` 
        }, { status: 400 })
      }
    }

    // Calculate tax (flat 8%) and shipping (flat $10, free over $150)
    const taxCents = Math.round(subtotalCents * 0.08)
    const shippingCents = subtotalCents >= 15000 ? 0 : 1000
    const totalCents = subtotalCents + taxCents + shippingCents

    // 3. Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCents,
      currency: 'usd',
      metadata: {
        cart_id: cartId,
        user_id: user?.id || null,
        shipping_address_id: shippingAddressId || null,
        shipping_cents: shippingCents,
        tax_cents: taxCents
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      subtotal_cents: subtotalCents,
      tax_cents: taxCents,
      shipping_cents: shippingCents,
      total_cents: totalCents
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
