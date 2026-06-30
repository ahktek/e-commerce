import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { mergeCarts } from '@/utils/cart-helpers'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('session_id')?.value

    if (!sessionId) {
      return NextResponse.json({ success: true })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      await mergeCarts(supabase, sessionId, user.id)
      cookieStore.delete('session_id')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to merge carts' }, { status: 500 })
  }
}
