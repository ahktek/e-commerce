'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import ProductCard from '@/components/ProductCard'

interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  price_cents: number
  image_urls: string[]
  is_active: boolean
  stock_quantity: number
  created_at: string
  category_id: string | null
}

interface Category {
  id: string
  name: string
  slug: string
}

// Fallback categories
const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Audio', slug: 'audio' },
  { id: 'c2', name: 'Wearables', slug: 'wearables' },
  { id: 'c3', name: 'Keyboards', slug: 'keyboards' },
  { id: 'c4', name: 'Accessories', slug: 'accessories' }
]

// Fallback products
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'm1',
    name: 'Aura Stealth Wireless Headset',
    slug: 'aura-stealth-wireless-headset',
    description: 'Immersive sound with active noise cancellation and 40h battery life.',
    price_cents: 14900,
    image_urls: [],
    is_active: true,
    stock_quantity: 15,
    created_at: new Date('2026-06-01').toISOString(),
    category_id: 'c1'
  },
  {
    id: 'm2',
    name: 'Luminary Chrono Watch',
    slug: 'luminary-chrono-watch',
    description: 'Premium quartz chronograph watch with stainless steel strap.',
    price_cents: 29900,
    image_urls: [],
    is_active: true,
    stock_quantity: 8,
    created_at: new Date('2026-06-15').toISOString(),
    category_id: 'c2'
  },
  {
    id: 'm3',
    name: 'Nexus Glass Mechanical Keyboard',
    slug: 'nexus-glass-mechanical-keyboard',
    description: 'Minimalist hot-swappable keyboard with acrylic body and RGB glow.',
    price_cents: 18900,
    image_urls: [],
    is_active: true,
    stock_quantity: 0, // Out of stock
    created_at: new Date('2026-06-20').toISOString(),
    category_id: 'c3'
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
    created_at: new Date('2026-06-25').toISOString(),
    category_id: 'c4'
  }
]

export default function ShopPage() {
  const supabase = createClient()

  // State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [priceMax, setPriceMax] = useState<number>(300)
  const [inStockOnly, setInStockOnly] = useState(false)
  const [sortBy, setSortBy] = useState<string>('newest')

  // Pagination
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 6

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1) // Reset page on search
    }, 400)

    return () => clearTimeout(handler)
  }, [search])

  // Fetch shop metadata (categories)
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const { data } = await supabase.from('categories').select('id, name, slug')
        if (data && data.length > 0) {
          setCategories(data)
        } else {
          setCategories(MOCK_CATEGORIES)
        }
      } catch (e) {
        setCategories(MOCK_CATEGORIES)
      }
    }
    fetchMetadata()
  }, [supabase])

  // Fetch products based on filters
  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .eq('is_active', true)

      // 1. Text Search Filter (FTS)
      if (debouncedSearch.trim() !== '') {
        // Format query for search: e.g. "headset & wireless" or "headset"
        const formattedQuery = debouncedSearch.trim().split(/\s+/).join(' & ')
        query = query.textSearch('fts', formattedQuery, { config: 'english' })
      }

      // 2. Category Filter
      if (selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory)
      }

      // 3. Price Filter (price_cents)
      query = query.lte('price_cents', priceMax * 100)

      // 4. In stock only
      if (inStockOnly) {
        query = query.gt('stock_quantity', 0)
      }

      // 5. Sorting
      if (sortBy === 'price_asc') {
        query = query.order('price_cents', { ascending: true })
      } else if (sortBy === 'price_desc') {
        query = query.order('price_cents', { ascending: false })
      } else if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false })
      }

      // Pagination limits
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, count, error } = await query

      if (error) throw error

      if (data && data.length > 0) {
        setProducts(data)
        setTotalCount(count || data.length)
      } else {
        // Fallback to client-side filtering of Mock Data if DB is empty
        applyClientSideFallback()
      }
    } catch (e) {
      applyClientSideFallback()
    } finally {
      setLoading(false)
    }
  }, [supabase, debouncedSearch, selectedCategory, priceMax, inStockOnly, sortBy, page])

  const applyClientSideFallback = () => {
    let filtered = [...MOCK_PRODUCTS]

    if (debouncedSearch.trim() !== '') {
      const q = debouncedSearch.toLowerCase()
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q))
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category_id === selectedCategory)
    }

    filtered = filtered.filter(p => p.price_cents <= priceMax * 100)

    if (inStockOnly) {
      filtered = filtered.filter(p => p.stock_quantity > 0)
    }

    if (sortBy === 'price_asc') {
      filtered.sort((a, b) => a.price_cents - b.price_cents)
    } else if (sortBy === 'price_desc') {
      filtered.sort((a, b) => b.price_cents - a.price_cents)
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    }

    setTotalCount(filtered.length)
    const from = (page - 1) * pageSize
    setProducts(filtered.slice(from, from + pageSize))
  }

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <div className="container" style={{ paddingBottom: '6rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Shop Catalog</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Sidebar Filters */}
        <aside className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h3>Filters</h3>

          {/* Search Bar */}
          <div className="form-group">
            <label className="form-label" htmlFor="search">Search</label>
            <input
              id="search"
              type="text"
              className="form-input"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="form-group">
            <label className="form-label" htmlFor="category">Category</label>
            <select
              id="category"
              className="form-input"
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setPage(1) }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Price Filter */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <label className="form-label">Max Price</label>
              <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>${priceMax}</span>
            </div>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={priceMax}
              onChange={(e) => { setPriceMax(Number(e.target.value)); setPage(1) }}
              style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>

          {/* Availability Checkbox */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              id="inStock"
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => { setInStockOnly(e.target.checked); setPage(1) }}
              style={{ width: '1.25rem', height: '1.25rem', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <label htmlFor="inStock" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>In Stock Only</label>
          </div>
        </aside>

        {/* Catalog Main Content */}
        <div>
          {/* Top Sort Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Showing {products.length} of {totalCount} items</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Sort By</span>
              <select
                className="form-input"
                style={{ padding: '0.5rem 1rem' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No products found matching filters.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '2rem' }}>
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '3rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                &larr; Prev
              </button>
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0 1rem', color: 'var(--text-secondary)' }}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
