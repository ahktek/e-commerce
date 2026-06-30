'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  
  // State
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [cartCount, setCartCount] = useState(0)
  
  // Search Overlay
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Mobile Drawer
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true)
      } else {
        setScrolled(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Load user status
  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    }
    getUser()
  }, [supabase])

  // Load and subscribe to cart item count
  const loadCartCount = async () => {
    try {
      const res = await fetch('/api/cart/items')
      const data = await res.json()
      if (data.items) {
        const count = data.items.reduce((acc: number, item: any) => acc + item.quantity, 0)
        setCartCount(count)
      }
    } catch (e) {
      // Ignore count fetch errors
    }
  }

  useEffect(() => {
    loadCartCount()
    
    // Listen for custom events to update count when items are added
    window.addEventListener('cart-updated', loadCartCount)
    return () => window.removeEventListener('cart-updated', loadCartCount)
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim() !== '') {
      router.push(`/shop?search=${encodeURIComponent(searchQuery)}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <>
      <header className={`navbar-sticky ${scrolled ? 'scrolled' : ''}`}>
        
        {/* Mobile Hamburger Trigger */}
        <button 
          className="icon-btn-pill" 
          style={{ display: 'none' }} /* Visible on mobile below */
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="4" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="6" x2="20" y2="6"></line>
            <line x1="4" y1="18" x2="20" y2="18"></line>
          </svg>
        </button>

        {/* Wordmark Logo */}
        <Link href="/" className="nav-logo" style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.75rem', letterSpacing: '-0.03em' }}>
          ZARE
        </Link>

        {/* Center Nav Links */}
        <nav className="nav-desktop-links" style={{ display: 'flex', gap: '2rem' }}>
          <Link href="/shop" className="nav-link" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>New Arrivals</Link>
          <Link href="/shop" className="nav-link" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Collections</Link>
          <Link href="/shop" className="nav-link" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>Best Sellers</Link>
          <Link href="/shop" className="nav-link" style={{ fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--lime)' }}>Sale</Link>
        </nav>

        {/* Right Icon Button Group */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          
          {/* Search Button */}
          <button 
            className="icon-btn-pill" 
            onClick={() => setSearchOpen(true)}
            aria-label="Search catalog"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {/* Account Button */}
          <Link 
            href={user ? '/account' : '/login'} 
            className="icon-btn-pill"
            aria-label="Account details"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </Link>

          {/* Wishlist Button */}
          <Link 
            href="/account?tab=wishlist" 
            className="icon-btn-pill"
            aria-label="My Wishlist"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </Link>

          {/* Cart Button */}
          <button 
            className="icon-btn-pill"
            aria-label="View shopping cart"
            onClick={() => window.dispatchEvent(new Event('open-cart-drawer'))}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {cartCount > 0 && (
              <span className="icon-btn-badge">{cartCount}</span>
            )}
          </button>

        </div>

      </header>

      {/* Global CSS for responsive nav layout adjustments */}
      <style jsx global>{`
        @media (max-width: 768px) {
          .nav-desktop-links {
            display: none !important;
          }
          header.navbar-sticky button[aria-label="Open menu"] {
            display: flex !important;
          }
        }
      `}</style>

      {/* Search Overlay */}
      {searchOpen && (
        <div className="search-overlay">
          <button 
            className="icon-btn-pill" 
            style={{ position: 'absolute', top: '2rem', right: '2rem' }}
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <form onSubmit={handleSearchSubmit} style={{ width: '100%', maxWidth: '600px', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)' }}>What are you looking for?</h2>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search catalog..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '100%', fontSize: '1.5rem', padding: '1rem 2rem' }}
              autoFocus
            />
            <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Press Enter to search</p>
          </form>
        </div>
      )}

      {/* Mobile Slide-in Drawer */}
      <div 
        className={`mobile-drawer-overlay`}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          zIndex: 1400,
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? 'auto' : 'none',
          transition: 'var(--transition)'
        }}
        onClick={() => setDrawerOpen(false)}
      />
      <div className={`mobile-drawer ${drawerOpen ? 'open' : ''}`}>
        <button 
          className="icon-btn-pill" 
          onClick={() => setDrawerOpen(false)}
          aria-label="Close menu"
          style={{ alignSelf: 'flex-end', marginBottom: '2rem' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2rem', fontSize: '1.5rem' }}>
          <Link href="/shop" className="nav-link" onClick={() => setDrawerOpen(false)}>New Arrivals</Link>
          <Link href="/shop" className="nav-link" onClick={() => setDrawerOpen(false)}>Collections</Link>
          <Link href="/shop" className="nav-link" onClick={() => setDrawerOpen(false)}>Best Sellers</Link>
          <Link href="/shop" className="nav-link" onClick={() => setDrawerOpen(false)} style={{ color: 'var(--lime)' }}>Sale</Link>
        </nav>
      </div>
    </>
  )
}
