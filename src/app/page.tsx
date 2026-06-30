import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import ProductCard from '@/components/ProductCard'
import HeroSlider from '@/components/HeroSlider'

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
}

interface Category {
  id: string
  name: string
  slug: string
}

async function getHomeData() {
  const supabase = await createClient()

  // 1. Fetch New Collection (Newest first)
  const { data: newCollection } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(4)

  // 2. Fetch Limited Stock (low stock: <= 5 items left, > 0)
  const { data: limitedStock } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .gt('stock_quantity', 0)
    .lte('stock_quantity', 5)
    .limit(4)

  // 3. Fetch Categories for "Style by Occasion" / Collections
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .limit(3)

  return {
    newCollection: (newCollection || []) as Product[],
    limitedStock: (limitedStock || []) as Product[],
    categories: (categories || []) as Category[]
  }
}

export default async function HomePage() {
  const { newCollection, limitedStock, categories } = await getHomeData()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Hero Slide Section */}
      <div className="container" style={{ paddingBottom: '2.5rem' }}>
        <HeroSlider />
      </div>

      {/* Section 1: Our New Collection */}
      <div className="container" style={{ paddingBottom: '5rem', paddingTop: '2.5rem' }}>
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
            <div>
              <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-heading)' }}>Our New Collection ✨</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Fresh arrivals curated for modern lifestyle professionals.</p>
            </div>
            <Link href="/shop?sort=newest" style={{ color: 'var(--text-primary)', textDecoration: 'underline', fontSize: '0.9rem', fontWeight: '700' }}>
              Explore All New &rarr;
            </Link>
          </div>
          
          {newCollection.length === 0 ? (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No new products available.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
              {newCollection.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Section 2: Limited Stock (Alternating Lavender Background Section) */}
      <div className="section-alternate">
        <div className="container">
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-heading)' }}>Limited Stock ⚡</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>High-demand items running out quickly. Grab yours now!</p>
              </div>
              <Link href="/shop" style={{ color: 'var(--text-primary)', textDecoration: 'underline', fontSize: '0.9rem', fontWeight: '700' }}>
                Browse All Gear &rarr;
              </Link>
            </div>

            {limitedStock.length === 0 ? (
              <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: '#fff' }}>
                No limited stock items available.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '2rem' }}>
                {limitedStock.map((product) => (
                  <ProductCard key={`limited-${product.id}`} product={product} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Section 3: Style by Occasion */}
      <div className="container" style={{ paddingBottom: '5rem', paddingTop: '5rem' }}>
        <section>
          <div style={{ marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontFamily: 'var(--font-heading)' }}>Style by Occasion 🏷️</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>Find the perfect companion collections suited for any work setups or travel modes.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            {categories.map((cat, idx) => {
              const cardGradient = idx === 0 
                ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)' 
                : idx === 1 
                ? 'linear-gradient(135deg, #2e104a 0%, #1c0630 100%)' 
                : 'linear-gradient(135deg, #2a1604 0%, #150b02 100%)'

              return (
                <Link 
                  href={`/shop?category=${cat.slug}`} 
                  key={cat.id} 
                  className="glass-card" 
                  style={{ 
                    textDecoration: 'none', 
                    color: '#ffffff',
                    padding: '3.5rem 2.5rem',
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'space-between',
                    height: '260px',
                    borderRadius: 'var(--radius-card)',
                    background: cardGradient,
                    position: 'relative',
                    overflow: 'hidden',
                    transition: 'var(--transition)'
                  }}
                >
                  <div>
                    <span className="tag-chip tag-chip-lavender" style={{ fontSize: '0.65rem', marginBottom: '1rem', border: 'none' }}>
                      Occasion Collection
                    </span>
                    <h3 style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-heading)', marginTop: '0.5rem', color: '#fff' }}>{cat.name}</h3>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--lime)', marginTop: '2rem' }}>
                    Explore Collection
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                      <polyline points="12 5 19 12 12 19"></polyline>
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      {/* Section 4: Testimonials (Alternating Lavender Background Section) */}
      <div className="section-alternate">
        <div className="container">
          <section>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <span className="tag-chip" style={{ marginBottom: '1rem' }}>Client Review</span>
              <h2 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-heading)', marginTop: '0.5rem' }}>What they say about ZARE 💬</h2>
            </div>

            {/* TODO: Connect this testimonials container to DB reviews/testimonials schema later */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
              
              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fff' }}>
                <div style={{ color: '#f59e0b', display: 'flex', gap: '0.1rem' }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  "The Nexus Mechanical Keyboard completely changed my desk workspace. Typing has never felt more premium and acoustic control is brilliant."
                </p>
                <div>
                  <h4 style={{ fontWeight: 'bold' }}>Alexander W.</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Software Architect</p>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fff' }}>
                <div style={{ color: '#f59e0b', display: 'flex', gap: '0.1rem' }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  "Exceptional leather craftsmanship on the Nomad Backpack. Commuting is much more structured and it handles weather drops beautifully."
                </p>
                <div>
                  <h4 style={{ fontWeight: 'bold' }}>Olivia S.</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Creative Director</p>
                </div>
              </div>

              <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', background: '#fff' }}>
                <div style={{ color: '#f59e0b', display: 'flex', gap: '0.1rem' }}>⭐⭐⭐⭐⭐</div>
                <p style={{ fontStyle: 'italic', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
                  "Aura Headset delivers crystal clear sound with amazing noise cancel settings. battery longevity easily matches my busy schedule."
                </p>
                <div>
                  <h4 style={{ fontWeight: 'bold' }}>Marcus K.</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Podcast Host & Producer</p>
                </div>
              </div>

            </div>
          </section>
        </div>
      </div>

    </div>
  )
}
