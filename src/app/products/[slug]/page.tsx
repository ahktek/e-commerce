'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price_cents: number
  image_urls: string[]
  is_active: boolean
  stock_quantity: number
  sku: string
}

interface Variant {
  id: string
  variant_name: string
  price_delta_cents: number
  stock_quantity: number
  sku: string
}

interface Review {
  id: string
  user_id: string
  rating: number
  title: string | null
  body: string | null
  is_verified_purchase: boolean
  created_at: string
  profile?: {
    full_name: string | null
  }
}

const MOCK_PRODUCTS = [
  {
    id: 'm1',
    name: 'Aura Stealth Wireless Headset',
    slug: 'aura-stealth-wireless-headset',
    description: 'Immersive sound with active noise cancellation and 40h battery life. Designed for daily creators and gamers.',
    price_cents: 14900,
    image_urls: [],
    is_active: true,
    stock_quantity: 15,
    sku: 'AURA-STLH-01'
  },
  {
    id: 'm2',
    name: 'Luminary Chrono Watch',
    slug: 'luminary-chrono-watch',
    description: 'Premium quartz chronograph watch with stainless steel strap and sapphire glass shield.',
    price_cents: 29900,
    image_urls: [],
    is_active: true,
    stock_quantity: 8,
    sku: 'LUMI-CHRN-02'
  },
  {
    id: 'm3',
    name: 'Nexus Glass Mechanical Keyboard',
    slug: 'nexus-glass-mechanical-keyboard',
    description: 'Minimalist hot-swappable keyboard with acrylic body and RGB glow.',
    price_cents: 18900,
    image_urls: [],
    is_active: true,
    stock_quantity: 0,
    sku: 'NEXS-MECH-03'
  },
  {
    id: 'm4',
    name: 'Nomad Leather Backpack',
    slug: 'nomad-leather-backpack',
    description: 'Full-grain leather travel backpack with 16" laptop compartment.',
    price_cents: 22000,
    image_urls: [],
    is_active: true,
    stock_quantity: 5,
    sku: 'NOMD-LTHR-04'
  }
]

const MOCK_VARIANTS: Record<string, Variant[]> = {
  m1: [
    { id: 'v1a', variant_name: 'Color: Obsidian Black', price_delta_cents: 0, stock_quantity: 10, sku: 'AURA-STLH-BLK' },
    { id: 'v1b', variant_name: 'Color: Arctic White', price_delta_cents: 1000, stock_quantity: 5, sku: 'AURA-STLH-WHT' }
  ],
  m2: [
    { id: 'v2a', variant_name: 'Style: Silver Mesh', price_delta_cents: 0, stock_quantity: 6, sku: 'LUMI-CHRN-SLV' },
    { id: 'v2b', variant_name: 'Style: Gold Link', price_delta_cents: 5000, stock_quantity: 2, sku: 'LUMI-CHRN-GLD' }
  ],
  m3: [
    { id: 'v3a', variant_name: 'Switch: Gateron Yellow', price_delta_cents: 0, stock_quantity: 0, sku: 'NEXS-MECH-GAT' },
    { id: 'v3b', variant_name: 'Switch: Cherry MX Brown', price_delta_cents: 1500, stock_quantity: 0, sku: 'NEXS-MECH-CHY' }
  ],
  m4: [
    { id: 'v4a', variant_name: 'Color: Desert Brown', price_delta_cents: 0, stock_quantity: 3, sku: 'NOMD-LTH-BRN' },
    { id: 'v4b', variant_name: 'Color: Midnight Black', price_delta_cents: 0, stock_quantity: 2, sku: 'NOMD-LTH-BLK' }
  ]
}

const MOCK_REVIEWS: Record<string, Review[]> = {
  m1: [
    { id: 'r1', user_id: 'user1', rating: 5, title: 'Amazing audio quality!', body: 'Best headset I have owned. Super comfortable and ANC is top notch.', is_verified_purchase: true, created_at: '2026-06-28T12:00:00Z', profile: { full_name: 'Marcus Aurelius' } },
    { id: 'r2', user_id: 'user2', rating: 4, title: 'Very solid, slightly heavy', body: 'Battery life is outstanding. Fits well, but heavy after a long workday.', is_verified_purchase: true, created_at: '2026-06-25T14:30:00Z', profile: { full_name: 'Sofia Coppola' } }
  ]
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params?.slug as string
  const supabase = createClient()

  // State
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  // Reviews settings
  const [reviewsSort, setReviewsSort] = useState<string>('newest')
  const [verifiedPurchase, setVerifiedPurchase] = useState(false)

  // Review Form
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewTitle, setReviewTitle] = useState('')
  const [reviewBody, setReviewBody] = useState('')
  const [reviewFormMessage, setReviewFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)

  const handleAddToCart = async () => {
    if (!product) return
    setAddingToCart(true)
    try {
      const res = await fetch('/api/cart/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariant?.id || null,
          quantity: 1
        })
      })
      if (res.ok) {
        window.dispatchEvent(new Event('cart-updated'))
        window.dispatchEvent(new CustomEvent('open-cart-drawer', {
          detail: { highlightItemId: selectedVariant?.id || product.id }
        }))
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add item to bag')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setAddingToCart(false)
    }
  }

  // Fetch current user
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)
    }
    getUser()
  }, [supabase])

  // Fetch Product Data
  const loadProductData = useCallback(async () => {
    setLoading(true)
    try {
      // 1. Get Product by Slug
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()

      if (productData) {
        setProduct(productData)

        // Fetch variants
        const { data: variantData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', productData.id)
        if (variantData) {
          setVariants(variantData)
          setSelectedVariant(variantData[0] || null)
        }

        // Fetch reviews
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('id, user_id, rating, title, body, is_verified_purchase, created_at, profiles(full_name)')
          .eq('product_id', productData.id)
        
        if (reviewsData) {
          const mappedReviews = reviewsData.map((r: any) => ({
            id: r.id,
            user_id: r.user_id,
            rating: r.rating,
            title: r.title,
            body: r.body,
            is_verified_purchase: r.is_verified_purchase,
            created_at: r.created_at,
            profile: { full_name: r.profiles?.full_name || 'Anonymous' }
          }))
          setReviews(mappedReviews)
        }

        // Check if verified purchaser
        if (currentUser) {
          const { data: orderItemCheck } = await supabase
            .from('orders')
            .select('id, status, order_items(id, product_id)')
            .eq('user_id', currentUser.id)
            .eq('status', 'delivered')
          
          const hasPurchased = orderItemCheck?.some(order => 
            order.order_items?.some((item: any) => item.product_id === productData.id)
          )
          setVerifiedPurchase(!!hasPurchased)
        }

      } else {
        // Fallback to MOCK Data
        applyMockData()
      }
    } catch (e) {
      applyMockData()
    } finally {
      setLoading(false)
    }
  }, [supabase, slug, currentUser])

  const applyMockData = () => {
    const mockProd = MOCK_PRODUCTS.find(p => p.slug === slug)
    if (mockProd) {
      setProduct(mockProd)
      const mockVars = MOCK_VARIANTS[mockProd.id] || []
      setVariants(mockVars)
      setSelectedVariant(mockVars[0] || null)
      setReviews(MOCK_REVIEWS[mockProd.id] || [])
      setVerifiedPurchase(true) // Allow submitting reviews in mock mode
    }
  }

  useEffect(() => {
    loadProductData()
  }, [loadProductData])

  // Save / Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !product) return
    setReviewFormMessage(null)

    const payload = {
      product_id: product.id,
      user_id: currentUser.id,
      rating: reviewRating,
      title: reviewTitle,
      body: reviewBody,
      is_verified_purchase: verifiedPurchase
    }

    if (editingReviewId) {
      const { error } = await supabase
        .from('reviews')
        .update(payload)
        .eq('id', editingReviewId)

      if (error) {
        setReviewFormMessage({ type: 'error', text: error.message })
      } else {
        setReviewFormMessage({ type: 'success', text: 'Review updated successfully!' })
        setEditingReviewId(null)
        setReviewTitle('')
        setReviewBody('')
        loadProductData()
      }
    } else {
      const { error } = await supabase
        .from('reviews')
        .insert(payload)

      if (error) {
        setReviewFormMessage({ type: 'error', text: error.message })
      } else {
        setReviewFormMessage({ type: 'success', text: 'Review submitted successfully!' })
        setReviewTitle('')
        setReviewBody('')
        loadProductData()
      }
    }
  }

  // Delete Review
  const handleDeleteReview = async (reviewId: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (error) {
      alert(error.message)
    } else {
      setReviews(reviews.filter(r => r.id !== reviewId))
    }
  }

  // Edit Review (Load into form)
  const handleEditReviewClick = (rev: Review) => {
    setEditingReviewId(rev.id)
    setReviewRating(rev.rating)
    setReviewTitle(rev.title || '')
    setReviewBody(rev.body || '')
    // Scroll to form
    document.getElementById('review-form-anchor')?.scrollIntoView({ behavior: 'smooth' })
  }

  // Sorting calculation
  const getSortedReviews = () => {
    const sorted = [...reviews]
    if (reviewsSort === 'newest') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else if (reviewsSort === 'highest') {
      sorted.sort((a, b) => b.rating - a.rating)
    } else if (reviewsSort === 'lowest') {
      sorted.sort((a, b) => a.rating - b.rating)
    }
    return sorted
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading product details...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '6rem' }}>
        <h2>Product not found</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>We couldn&apos;t find the product you were looking for.</p>
        <Link href="/shop" className="btn btn-primary" style={{ marginTop: '2rem' }}>Back to Shop</Link>
      </div>
    )
  }

  // Details calculations
  const basePrice = product.price_cents
  const variantPriceDelta = selectedVariant ? selectedVariant.price_delta_cents : 0
  const totalPrice = basePrice + variantPriceDelta

  const stockQuantity = selectedVariant ? selectedVariant.stock_quantity : product.stock_quantity
  const isOutOfStock = stockQuantity <= 0
  const isLowStock = stockQuantity > 0 && stockQuantity < 5

  const avgRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : 'No reviews'

  const cardGradient = `linear-gradient(135deg, hsl(${(product.name.length * 7) % 360}, 60% , 25%) 0%, #111 100%)`

  return (
    <div className="container" style={{ paddingBottom: '6rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', marginBottom: '6rem' }}>
        
        {/* Gallery Section */}
        <div>
          <div style={{ 
            height: '460px', 
            borderRadius: 'var(--radius-lg)', 
            background: cardGradient, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 8px 32px 0 rgba(0,0,0,0.3)'
          }}>
            {product.image_urls?.[0] ? (
              <img src={product.image_urls[0]} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <span style={{ fontSize: '2rem', color: '#fff', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{product.name}</span>
            )}
          </div>
        </div>

        {/* Info / Selector Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{product.name}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>SKU: {selectedVariant ? selectedVariant.sku : product.sku}</p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: '800', color: 'var(--primary)' }}>
              ${(totalPrice / 100).toFixed(2)}
            </span>
            <span className={`badge ${isOutOfStock ? 'badge-error' : isLowStock ? 'badge-warning' : 'badge-success'}`}>
              {isOutOfStock ? 'Out of Stock' : isLowStock ? `Low Stock (Only ${stockQuantity} left)` : 'In Stock'}
            </span>
          </div>

          <div>
            <h3>Description</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: '1.6' }}>{product.description}</p>
          </div>

          {/* Variants Selector */}
          {variants.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '0.75rem' }}>Select Option</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {variants.map(variant => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`btn ${selectedVariant?.id === variant.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.9rem' }}
                  >
                    {variant.variant_name} {variant.price_delta_cents !== 0 ? `(+$${(variant.price_delta_cents / 100).toFixed(2)})` : ''}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '1rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }} 
              disabled={isOutOfStock || addingToCart}
              onClick={handleAddToCart}
            >
              {isOutOfStock ? 'Sold Out' : addingToCart ? 'Adding to Bag...' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <section style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '4rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '4rem' }}>
          
          {/* Summary Column */}
          <div>
            <h2 style={{ marginBottom: '1.5rem' }}>Customer Reviews</h2>
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', textAlign: 'center' }}>
              <span style={{ fontSize: '3rem', fontWeight: '800' }}>{avgRating}</span>
              <span style={{ color: 'var(--text-secondary)' }}>Based on {reviews.length} reviews</span>
              <div style={{ display: 'flex', gap: '0.2rem', fontSize: '1.25rem', color: '#f59e0b' }}>
                {reviews.length > 0 && Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < Math.round(Number(avgRating)) ? '★' : '☆'}</span>
                ))}
              </div>
            </div>
          </div>

          {/* List and Form Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* Reviews header & sorting */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Reviews ({reviews.length})</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sort by</span>
                <select className="form-input" style={{ padding: '0.4rem 0.8rem' }} value={reviewsSort} onChange={(e) => setReviewsSort(e.target.value)}>
                  <option value="newest">Newest</option>
                  <option value="highest">Highest Rating</option>
                  <option value="lowest">Lowest Rating</option>
                </select>
              </div>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No reviews yet. Be the first to share your experience!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {getSortedReviews().map((review) => {
                  const isAuthor = currentUser?.id === review.user_id
                  return (
                    <div key={review.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.2rem', color: '#f59e0b', fontSize: '0.95rem' }}>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i}>{i < review.rating ? '★' : '☆'}</span>
                          ))}
                        </div>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {review.title}
                          {review.is_verified_purchase && (
                            <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>Verified Purchase</span>
                          )}
                        </h4>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5' }}>{review.body}</p>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          By {review.profile?.full_name || 'Verified Customer'}
                        </span>
                        {isAuthor && (
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleEditReviewClick(review)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDeleteReview(review.id)} className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Add Review Form */}
            {currentUser ? (
              <div id="review-form-anchor" className="glass-card" style={{ border: '1px solid var(--border-focus)', marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>{editingReviewId ? 'Edit Your Review' : 'Add a Review'}</h3>
                {reviewFormMessage && (
                  <div className={`alert alert-${reviewFormMessage.type}`}>
                    <span>{reviewFormMessage.text}</span>
                  </div>
                )}
                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label">Rating</label>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '1.5rem', color: '#f59e0b' }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          onClick={() => setReviewRating(star)}
                          style={{ cursor: 'pointer' }}
                        >
                          {star <= reviewRating ? '★' : '☆'}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reviewTitle">Review Title</label>
                    <input
                      id="reviewTitle"
                      type="text"
                      className="form-input"
                      placeholder="Summarize your experience..."
                      required
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="reviewBody">Review Body</label>
                    <textarea
                      id="reviewBody"
                      rows={4}
                      className="form-input"
                      placeholder="What did you like or dislike?"
                      required
                      value={reviewBody}
                      onChange={(e) => setReviewBody(e.target.value)}
                      style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <button type="submit" className="btn btn-primary">
                      {editingReviewId ? 'Update Review' : 'Submit Review'}
                    </button>
                    {editingReviewId && (
                      <button type="button" className="btn btn-secondary" onClick={() => { setEditingReviewId(null); setReviewTitle(''); setReviewBody('') }}>
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            ) : (
              <div className="alert alert-warning" style={{ margin: 0 }}>
                <span>Please <Link href="/login" style={{ color: 'inherit', fontWeight: 'bold' }}>sign in</Link> to write a review.</span>
              </div>
            )}

          </div>
        </div>
      </section>
    </div>
  )
}
