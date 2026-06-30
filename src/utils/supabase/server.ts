import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url && url.includes('/rest/v1')) {
    url = url.split('/rest/v1')[0]
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isValid = !!(url && url.startsWith('http'))
  const finalUrl = isValid && url ? url : 'https://placeholder.supabase.co'

  return createServerClient(
    finalUrl,
    key || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  )
}

export async function createServiceRoleClient() {
  const cookieStore = await cookies()
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url && url.includes('/rest/v1')) {
    url = url.split('/rest/v1')[0]
  }
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const isValid = !!(url && url.startsWith('http'))
  const finalUrl = isValid && url ? url : 'https://placeholder.supabase.co'

  return createServerClient(
    finalUrl,
    key || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored
          }
        },
      },
    }
  )
}
