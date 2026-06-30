import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url && url.includes('/rest/v1')) {
    url = url.split('/rest/v1')[0]
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isValid = !!(url && url.startsWith('http'))
  const finalUrl = isValid && url ? url : 'https://placeholder.supabase.co'

  return createBrowserClient(
    finalUrl,
    key || 'placeholder-key'
  )
}
