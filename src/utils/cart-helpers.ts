import { createClient } from '@/utils/supabase/server'
import { SupabaseClient } from '@supabase/supabase-js'

export async function getOrCreateActiveCart(
  supabase: SupabaseClient,
  userId?: string,
  sessionId?: string
) {
  if (userId) {
    // 1. Check if user has an active cart
    const { data: userCart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (userCart) return userCart

    // 2. Create one if not found
    const { data: newCart } = await supabase
      .from('carts')
      .insert({ user_id: userId, status: 'active' })
      .select()
      .single()

    return newCart
  } else if (sessionId) {
    // 1. Check if guest has an active cart
    const { data: guestCart } = await supabase
      .from('carts')
      .select('*')
      .is('user_id', null)
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .maybeSingle()

    if (guestCart) return guestCart

    // 2. Create one if not found
    const { data: newCart } = await supabase
      .from('carts')
      .insert({ session_id: sessionId, status: 'active' })
      .select()
      .single()

    return newCart
  }
  return null
}

export async function mergeCarts(
  supabase: SupabaseClient,
  guestSessionId: string,
  userId: string
) {
  // 1. Find guest cart
  const { data: guestCart } = await supabase
    .from('carts')
    .select('*')
    .is('user_id', null)
    .eq('session_id', guestSessionId)
    .eq('status', 'active')
    .maybeSingle()

  if (!guestCart) return

  // 2. Find user's active cart
  const { data: userCart } = await supabase
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (!userCart) {
    // User doesn't have an active cart, simply assign the guest cart to the user
    await supabase
      .from('carts')
      .update({ user_id: userId, session_id: null })
      .eq('id', guestCart.id)
    return
  }

  // 3. Both carts exist, merge guest items into user cart
  const { data: guestItems } = await supabase
    .from('cart_items')
    .select('*')
    .eq('cart_id', guestCart.id)

  if (guestItems && guestItems.length > 0) {
    for (const item of guestItems) {
      // Check if user cart already has this item (matching variant and product)
      let query = supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', userCart.id)
        .eq('product_id', item.product_id)

      if (item.variant_id) {
        query = query.eq('variant_id', item.variant_id)
      } else {
        query = query.is('variant_id', null)
      }

      const { data: existingUserItem } = await query.maybeSingle()

      if (existingUserItem) {
        // Update quantity
        await supabase
          .from('cart_items')
          .update({ quantity: existingUserItem.quantity + item.quantity })
          .eq('id', existingUserItem.id)
      } else {
        // Move item to user cart
        await supabase
          .from('cart_items')
          .update({ cart_id: userCart.id })
          .eq('id', item.id)
      }
    }
  }

  // 4. Delete the empty guest cart
  await supabase.from('carts').delete().eq('id', guestCart.id)
}
