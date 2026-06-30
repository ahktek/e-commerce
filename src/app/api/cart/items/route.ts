import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { getOrCreateActiveCart } from '@/utils/cart-helpers'

// GET: Retrieve current active cart items and calculate totals
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    let sessionId = cookieStore.get('session_id')?.value
    if (!user && !sessionId) {
      return NextResponse.json({ items: [], subtotal_cents: 0 })
    }

    const cart = await getOrCreateActiveCart(supabase, user?.id, sessionId)
    if (!cart) {
      return NextResponse.json({ items: [], subtotal_cents: 0 })
    }

    // Fetch items with product and variant details
    const { data: items, error } = await supabase
      .from('cart_items')
      .select('id, product_id, variant_id, quantity, unit_price_cents, products(name, price_cents, image_urls, stock_quantity), product_variants(variant_name, price_delta_cents, stock_quantity)')
      .eq('cart_id', cart.id)

    if (error) throw error

    let subtotalCents = 0
    const validatedItems = (items || []).map((item: any) => {
      // Recalculate actual current price
      const basePrice = item.products?.price_cents || 0
      const delta = item.product_variants?.price_delta_cents || 0
      const currentPrice = basePrice + delta
      const totalItemPrice = currentPrice * item.quantity
      subtotalCents += totalItemPrice

      // Check stock status
      const stockAvailable = item.variant_id 
        ? item.product_variants?.stock_quantity 
        : item.products?.stock_quantity
      const isAvailable = stockAvailable >= item.quantity

      return {
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        unit_price_cents: currentPrice,
        name: item.products?.name || 'Unknown Product',
        variant_name: item.product_variants?.variant_name || null,
        image_url: item.products?.image_urls?.[0] || null,
        stock_quantity: stockAvailable,
        is_available: isAvailable
      }
    })

    return NextResponse.json({
      cart_id: cart.id,
      items: validatedItems,
      subtotal_cents: subtotalCents
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Add an item to the cart
export async function POST(request: Request) {
  try {
    const { productId, variantId, quantity } = await request.json()
    if (!productId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid input parameters' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let sessionId = cookieStore.get('session_id')?.value
    if (!user && !sessionId) {
      sessionId = crypto.randomUUID()
      cookieStore.set('session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/'
      })
    }

    const cart = await getOrCreateActiveCart(supabase, user?.id, sessionId)
    if (!cart) {
      return NextResponse.json({ error: 'Failed to access cart' }, { status: 500 })
    }

    // Validate product price and variant price delta
    const { data: product } = await supabase
      .from('products')
      .select('price_cents')
      .eq('id', productId)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    let delta = 0
    if (variantId) {
      const { data: variant } = await supabase
        .from('product_variants')
        .select('price_delta_cents')
        .eq('id', variantId)
        .single()
      if (variant) delta = variant.price_delta_cents
    }
    const currentPrice = product.price_cents + delta

    // Check if item already exists in cart
    let itemQuery = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)

    if (variantId) {
      itemQuery = itemQuery.eq('variant_id', variantId)
    } else {
      itemQuery = itemQuery.is('variant_id', null)
    }

    const { data: existingItem } = await itemQuery.maybeSingle()

    if (existingItem) {
      // Update quantity
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity, unit_price_cents: currentPrice })
        .eq('id', existingItem.id)
      if (error) throw error
    } else {
      // Insert new item
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          variant_id: variantId || null,
          quantity,
          unit_price_cents: currentPrice
        })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT: Update cart item quantity
export async function PUT(request: Request) {
  try {
    const { itemId, quantity } = await request.json()
    if (!itemId || !quantity || quantity <= 0) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Remove item from cart
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) {
      return NextResponse.json({ error: 'Missing item ID' }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
