import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  let url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url && url.includes('/rest/v1')) {
    url = url.split('/rest/v1')[0]
  }
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isValid = !!(url && url.startsWith('http'))
  const finalUrl = isValid && url ? url : 'https://placeholder.supabase.co'

  const supabase = createServerClient(
    finalUrl,
    key || 'placeholder-key',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Protect /account and /checkout routes
    if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
      if (!user) {
        const urlObj = request.nextUrl.clone()
        urlObj.pathname = '/login'
        urlObj.searchParams.set('redirectTo', pathname)
        return NextResponse.redirect(urlObj)
      }
    }

    // If logged in and trying to go to login page, redirect to account
    if (pathname === '/login' && user) {
      const urlObj = request.nextUrl.clone()
      urlObj.pathname = '/account'
      return NextResponse.redirect(urlObj)
    }
  } catch (e) {
    // If Supabase keys are missing or invalid, bypass blocking page load to prevent 500 crashes
    console.error('Proxy auth check failed:', e)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files and assets.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
