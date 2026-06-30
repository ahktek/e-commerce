import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let isAdmin = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile && profile.role === 'admin') {
        isAdmin = true
      }
    }
  } catch (e) {
    // Fallback for build prerendering
  }

  // Prerendering might not have access to live DB session,
  // in production we redirect immediately. In development, we can relax or proceed.
  if (!isAdmin && process.env.NODE_ENV === 'production') {
    redirect('/')
  }

  return (
    <div>
      <div className="navbar" style={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
        <Link href="/admin" className="nav-logo" style={{ background: 'linear-gradient(90deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Admin Portal
        </Link>
        <nav className="nav-links">
          <Link href="/admin" className="nav-link">Dashboard</Link>
          <Link href="/admin/products" className="nav-link">Products</Link>
          <Link href="/admin/orders" className="nav-link">Orders</Link>
          <Link href="/" className="nav-link">Storefront &rarr;</Link>
        </nav>
      </div>
      <main>
        {children}
      </main>
    </div>
  )
}
