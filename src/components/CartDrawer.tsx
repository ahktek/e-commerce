'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CartItem {
  id: string
  product_id: string
  variant_id: string | null
  quantity: number
  unit_price_cents: number
  name: string
  variant_name: string | null
  image_url: string | null
  stock_quantity: number
  is_available: boolean
}

export default function CartDrawer() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<string | null>(null)
  const [subtotal, setSubtotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [highlightId, setHighlightId] = useState<string | null>(null)

  const fetchCartItems = async () => {
    try {
      const res = await fetch('/api/cart/items')
      const data = await res.json()
      if (data.items) {
        setItems(data.items)
        setCartId(data.cart_id)
        setSubtotal(data.subtotal_cents)
      }
    } catch (e) {
      console.error('Error fetching cart')
    }
  }

  useEffect(() => {
    // Initial fetch
    fetchCartItems()

    // Register event listeners
    const handleOpen = (e: Event) => {
      setOpen(true)
      const customEvent = e as CustomEvent
      if (customEvent.detail?.highlightItemId) {
        const id = customEvent.detail.highlightItemId
        setHighlightId(id)
        setTimeout(() => setHighlightId(null), 2500)
      }
      fetchCartItems()
    }

    const handleUpdate = () => {
      fetchCartItems()
    }

    window.addEventListener('open-cart-drawer', handleOpen)
    window.addEventListener('cart-updated', handleUpdate)

    return () => {
      window.removeEventListener('open-cart-drawer', handleOpen)
      window.removeEventListener('cart-updated', handleUpdate)
    }
  }, [])

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty <= 0) return
    setUpdatingId(itemId)
    try {
      await fetch('/api/cart/items', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQty })
      })
      await fetchCartItems()
      window.dispatchEvent(new Event('cart-updated'))
    } catch (e) {
      console.error('Error updating quantity')
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingId(itemId)
    try {
      await fetch(`/api/cart/items?itemId=${itemId}`, {
        method: 'DELETE'
      })
      await fetchCartItems()
      window.dispatchEvent(new Event('cart-updated'))
    } catch (e) {
      console.error('Error removing item')
    } finally {
      setUpdatingId(null)
    }
  }

  const allAvailable = items.every(item => item.is_available)
  const hasItems = items.length > 0

  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className={`cart-drawer-overlay ${open ? 'open' : ''}`} 
        onClick={() => setOpen(false)}
      />

      {/* Drawer Container */}
      <div className={`cart-drawer ${open ? 'open' : ''}`}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--border-glass)' }}>
          <h2 style={{ fontSize: '1.5rem', fontFamily: 'var(--font-heading)' }}>Shopping Bag</h2>
          <button 
            className="icon-btn-pill" 
            onClick={() => setOpen(false)}
            aria-label="Close cart"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Cart items list / Scrollable area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!hasItems ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1.5rem', textAlign: 'center' }}>
              <span style={{ fontSize: '4rem' }}>🛍️</span>
              <div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Your bag is empty</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Add some premium essentials to get started.</p>
              </div>
              <Link 
                href="/shop" 
                className="btn btn-primary" 
                onClick={() => setOpen(false)}
                style={{ width: '100%' }}
              >
                Browse Products
              </Link>
            </div>
          ) : (
            items.map((item) => {
              const isHighlighted = item.id === highlightId || item.product_id === highlightId
              const cardGradient = `linear-gradient(135deg, hsl(${(item.name.length * 7) % 360}, 60%, 25%) 0%, #111 100%)`
              
              return (
                <div 
                  key={item.id} 
                  className={`glass-card ${isHighlighted ? 'item-highlight-pulse' : ''}`}
                  style={{ 
                    display: 'flex', 
                    gap: '1rem', 
                    padding: '1rem',
                    alignItems: 'center',
                    opacity: updatingId === item.id ? 0.6 : 1,
                    transition: 'var(--transition)',
                    borderWidth: isHighlighted ? '2px' : '1px'
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ 
                    width: '72px', 
                    height: '72px', 
                    borderRadius: 'var(--radius-sm)', 
                    background: cardGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 'bold' }}>{item.name.split(' ')[0]}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-primary)' }}>{item.name}</h4>
                    {item.variant_name && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.variant_name}</p>
                    )}
                    <span style={{ fontWeight: '700', color: 'var(--lime)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                      ${(item.unit_price_cents / 100).toFixed(2)}
                    </span>
                    {!item.is_available && (
                      <span className="badge badge-error" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', alignSelf: 'start', marginTop: '0.25rem' }}>
                        Out of Stock
                      </span>
                    )}
                  </div>

                  {/* Stepper & Delete */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-glass)', padding: '0.2rem' }}>
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={item.quantity <= 1 || updatingId === item.id}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 'bold', width: '16px', textAlign: 'center' }}>{item.quantity}</span>
                      <button 
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        disabled={updatingId === item.id || item.quantity >= item.stock_quantity}
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={updatingId === item.id}
                    >
                      Remove
                    </button>
                  </div>

                </div>
              )
            })
          )}
        </div>

        {/* Footer Sum & Action */}
        {hasItems && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '1.1rem', fontWeight: 'bold' }}>
              <span>Subtotal</span>
              <span style={{ color: 'var(--lime)' }}>${(subtotal / 100).toFixed(2)}</span>
            </div>

            {!allAvailable && (
              <div className="alert alert-error" style={{ fontSize: '0.8rem', padding: '0.75rem', margin: 0 }}>
                Adjust quantities to proceed. Some items are low in stock.
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
              disabled={!allAvailable}
              onClick={() => {
                setOpen(false)
                router.push(`/checkout?cartId=${cartId}`)
              }}
            >
              Checkout Now
            </button>

            <button 
              className="btn btn-secondary" 
              onClick={() => setOpen(false)}
              style={{ width: '100%', background: 'none', border: 'none', textDecoration: 'underline' }}
            >
              Continue Shopping
            </button>
          </div>
        )}

      </div>
    </>
  )
}
