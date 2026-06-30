'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price_cents: number
  image_urls: string[]
  is_active: boolean
  created_at: string
}

export default function ProductCard({ product }: { product: Product }) {
  const [adding, setAdding] = useState(false)
  const cardGradient = `linear-gradient(135deg, hsl(${(product.name.length * 7) % 360}, 60%, 25%) 0%, #111 100%)`

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (adding) return
    setAdding(true)

    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: null,
          quantity: 1
        })
      })

      if (res.ok) {
        window.dispatchEvent(new Event('cart-updated'))
        window.dispatchEvent(new CustomEvent('open-cart-drawer', {
          detail: { highlightItemId: product.id }
        }))
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add item to bag')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAdding(false)
    }
  }

  return (
    <Link href={`/products/${product.slug}`} className="glass-card product-card">
      <div className="product-card-image-wrap" style={{ background: cardGradient }}>
        {product.image_urls?.[0] ? (
          <img src={product.image_urls[0]} alt={product.name} className="product-card-image" />
        ) : (
          <span style={{ color: '#fff', opacity: 0.9, fontWeight: '700', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{product.name}</span>
        )}
        
        {/* Quick Add Pill/Rounded Button */}
        <button 
          className="product-card-quick-add"
          onClick={handleQuickAdd}
          disabled={adding}
          aria-label="Quick add to bag"
        >
          {adding ? (
            <span style={{ fontSize: '0.6rem' }}>...</span>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{product.name}</h3>
        {product.description && (
          <p style={{ 
            color: 'var(--text-secondary)', 
            fontSize: '0.85rem', 
            lineHeight: '1.4', 
            height: '2.8rem', 
            overflow: 'hidden', 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            textOverflow: 'ellipsis', 
            marginBottom: '0.25rem' 
          }}>
            {product.description}
          </p>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
          <span style={{ fontWeight: '700', color: 'var(--lime)', fontSize: '1.25rem' }}>
            ${(product.price_cents / 100).toFixed(2)}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>In Stock</span>
        </div>
      </div>
    </Link>
  )
}
