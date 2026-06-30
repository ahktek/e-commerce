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

export default function CartPage() {
  const router = useRouter()
  const [items, setItems] = useState<CartItem[]>([])
  const [cartId, setCartId] = useState<string | null>(null)
  const [subtotal, setSubtotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCartItems()
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
    } catch (e) {
      console.error('Error removing item')
    } finally {
      setUpdatingId(null)
    }
  }

  const allAvailable = items.every(item => item.is_available)
  const hasItems = items.length > 0

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading cart items...</p>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingBottom: '6rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2.5rem' }}>Shopping Cart</h1>

      {!hasItems ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Your shopping cart is empty.</p>
          <Link href="/shop" className="btn btn-primary" style={{ marginTop: '2rem' }}>
            Go Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '3rem', alignItems: 'start' }}>
          
          {/* Cart Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {items.map((item) => {
              const cardGradient = `linear-gradient(135deg, hsl(${(item.name.length * 7) % 360}, 60%, 25%) 0%, #111 100%)`
              return (
                <div key={item.id} className="glass-card" style={{ 
                  display: 'flex', 
                  gap: '1.5rem', 
                  alignItems: 'center',
                  padding: '1.25rem',
                  opacity: updatingId === item.id ? 0.6 : 1,
                  transition: 'var(--transition)'
                }}>
                  {/* Product Preview Image */}
                  <div style={{ 
                    width: '100px', 
                    height: '100px', 
                    borderRadius: 'var(--radius-md)', 
                    background: cardGradient,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    padding: '0.5rem',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ color: '#fff' }}>{item.name.split(' ')[0]}</span>
                    )}
                  </div>

                  {/* Info details */}
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{item.name}</h3>
                    {item.variant_name && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.variant_name}</p>
                    )}
                    <span style={{ fontWeight: 'bold', color: 'var(--primary)', marginTop: '0.25rem' }}>
                      ${(item.unit_price_cents / 100).toFixed(2)}
                    </span>
                    {!item.is_available && (
                      <span className="badge badge-error" style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', alignSelf: 'start', marginTop: '0.5rem' }}>
                        Low Stock (Only {item.stock_quantity} left)
                      </span>
                    )}
                  </div>

                  {/* Quantity controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem' }}
                      disabled={item.quantity <= 1 || updatingId === item.id}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span style={{ width: '2rem', textAlign: 'center', fontWeight: 'bold' }}>{item.quantity}</span>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '0.4rem 0.8rem' }}
                      disabled={updatingId === item.id || item.quantity >= item.stock_quantity}
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button 
                    className="btn btn-danger" 
                    style={{ padding: '0.4rem 0.8rem' }}
                    disabled={updatingId === item.id}
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>

          {/* Cart Summary Card */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <h3>Order Summary</h3>
            
            <div style={{ borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>${(subtotal / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Shipping</span>
                <span>{subtotal >= 15000 ? 'Free' : '$10.00'}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
              <span>Total Est.</span>
              <span>${((subtotal + (subtotal >= 15000 ? 0 : 1000)) / 100).toFixed(2)}</span>
            </div>

            {!allAvailable && (
              <div className="alert alert-error" style={{ fontSize: '0.8rem', padding: '0.75rem' }}>
                Some items are low on stock. Please adjust quantities before checkout.
              </div>
            )}

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem' }}
              disabled={!allAvailable}
              onClick={() => router.push(`/checkout?cartId=${cartId}`)}
            >
              Proceed to Checkout
            </button>
          </div>

        </div>
      )}
    </div>
  )
}
