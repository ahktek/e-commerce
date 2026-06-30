import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/utils/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2025-01-27.accredited-backpacks' as any
})

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder'
    )
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 })
  }

  const supabase = await createServiceRoleClient()

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const cartId = paymentIntent.metadata.cart_id
    const shippingAddressId = paymentIntent.metadata.shipping_address_id
    const shippingCents = parseInt(paymentIntent.metadata.shipping_cents || '0', 10)
    const taxCents = parseInt(paymentIntent.metadata.tax_cents || '0', 10)

    // Check if order already exists for this payment intent
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('stripe_payment_intent_id', paymentIntent.id)
      .maybeSingle()

    if (!existingOrder && cartId) {
      // Call secure Postgres RPC function to generate the order
      const { data: orderId, error: rpcError } = await supabase.rpc('create_order_from_cart', {
        p_cart_id: cartId,
        p_shipping_address_id: shippingAddressId || null,
        p_billing_address_id: shippingAddressId || null,
        p_shipping_cents: shippingCents,
        p_tax_cents: taxCents
      })

      if (rpcError) {
        console.error('RPC Order Creation Error:', rpcError)
        return NextResponse.json({ error: rpcError.message }, { status: 500 })
      }

      if (orderId) {
        // Update order status to paid and assign the stripe payment intent ID
        await supabase
          .from('orders')
          .update({
            status: 'paid',
            stripe_payment_intent_id: paymentIntent.id
          })
          .eq('id', orderId)
      }
    }
  }

  return NextResponse.json({ received: true })
}
