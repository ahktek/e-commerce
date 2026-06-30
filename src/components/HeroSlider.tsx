'use client'

import React, { useEffect, useState, useCallback } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Link from 'next/link'

interface SlideData {
  id: number
  title: string
  subcopy: string
  ctaText: string
  ctaLink: string
  imageGradient: string
  imageText: string
  badgeText: string
  badgePrice: string
  theme: 'lavender' | 'lime' | 'dark'
  tagChips: { label: string; link: string; isLavender?: boolean }[]
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    title: "We're unveiling Chic, your ultimate fashion destination",
    subcopy: "Explore an immersive online line, curated to define your wardrobe. Elevate your style from quick and effortless.",
    ctaText: "New Collection",
    ctaLink: "/shop",
    imageGradient: "linear-gradient(135deg, #E8D9F5 0%, #D4F542 100%)",
    imageText: "ZARE FASHION '26",
    badgeText: "Best Seller",
    badgePrice: "49.99 EUR",
    theme: 'lime',
    tagChips: [
      { label: "Best Sellers", link: "/shop?sort=popular" },
      { label: "New Arrivals", link: "/shop?sort=newest" },
      { label: "30% Off", link: "/shop?sale=true", isLavender: true },
      { label: "Collections", link: "/shop" },
      { label: "Lifestyle", link: "/shop" }
    ]
  },
  {
    id: 2,
    title: "Define your workspace. Premium acoustics & keys.",
    subcopy: "Tactile hot-swappable mechanical keyboards and noise-cancelling acoustics designed for elite setups.",
    ctaText: "Explore Gear",
    ctaLink: "/shop?category=keyboards",
    imageGradient: "linear-gradient(135deg, #1e1b4b 0%, #0d0c11 100%)",
    imageText: "STEALTH AUDIO & KEYS",
    badgeText: "Stealth ANC",
    badgePrice: "149.00 USD",
    theme: 'lavender',
    tagChips: [
      { label: "Keyboards", link: "/shop?category=keyboards" },
      { label: "Audio", link: "/shop?category=audio", isLavender: true },
      { label: "Wireless", link: "/shop" },
      { label: "Best Sellers", link: "/shop?sort=popular" }
    ]
  },
  {
    id: 3,
    title: "Nomad Travel. Full-grain genuine leather.",
    subcopy: "Water-resistant packs and commute carry accessories tailored for daily explorers and weekend trips.",
    ctaText: "Shop Leatherware",
    ctaLink: "/shop?category=accessories",
    imageGradient: "linear-gradient(135deg, #2a1b0c 0%, #0d0c11 100%)",
    imageText: "NOMAD LEATHER BAGS",
    badgeText: "Full-Grain",
    badgePrice: "220.00 USD",
    theme: 'dark',
    tagChips: [
      { label: "Nomad Bags", link: "/shop?category=accessories" },
      { label: "Limited Edition", link: "/shop", isLavender: true },
      { label: "Genuine Leather", link: "/shop" }
    ]
  }
]

export default function HeroSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [isPaused, setIsPaused] = useState(false)

  // Navigate handlers
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi])
  const scrollTo = useCallback((index: number) => emblaApi && emblaApi.scrollTo(index), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi, setSelectedIndex])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  // Autoplay Logic (every 5 seconds, pauses on hover)
  useEffect(() => {
    if (!emblaApi || isPaused) return
    
    const intervalId = setInterval(() => {
      emblaApi.scrollNext()
    }, 5000)

    return () => clearInterval(intervalId)
  }, [emblaApi, isPaused])

  return (
    <div 
      style={{ position: 'relative', width: '100%' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Embla Viewport */}
      <div ref={emblaRef} style={{ overflow: 'hidden', width: '100%', borderRadius: 'var(--radius-card)' }}>
        <div style={{ display: 'flex', touchAction: 'pan-y' }}>
          {SLIDES.map((slide) => (
            <div key={slide.id} style={{ 
              flex: '0 0 100%', 
              minWidth: '0', 
              position: 'relative',
              background: 'rgba(232, 217, 245, 0.02)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-card)',
              padding: '2.5rem',
              boxShadow: 'var(--shadow-soft)'
            }}>
              
              {/* Split Grid */}
              <div className="hero-split-grid">
                
                {/* Text Content Block */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1.5rem', zIndex: 5 }}>
                  <h1 style={{ 
                    fontSize: '3rem', 
                    lineHeight: '1.15', 
                    fontWeight: 800,
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.03em'
                  }}>
                    {slide.title}
                  </h1>
                  <p style={{ 
                    color: 'var(--text-secondary)', 
                    fontSize: '1.05rem', 
                    lineHeight: '1.6', 
                    maxWidth: '520px',
                    fontFamily: 'var(--font-sans)'
                  }}>
                    {slide.subcopy}
                  </p>
                  
                  {/* CTA Button */}
                  <div style={{ marginTop: '0.5rem' }}>
                    <Link 
                      href={slide.ctaLink} 
                      className={`btn ${slide.theme === 'lime' ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ 
                        fontSize: '1rem', 
                        padding: '0.9rem 2.25rem',
                        background: slide.theme === 'lavender' ? 'var(--lavender)' : slide.theme === 'lime' ? 'var(--lime)' : undefined,
                        color: slide.theme === 'dark' ? '#fff' : '#0d0c11'
                      }}
                    >
                      {slide.ctaText}
                    </Link>
                  </div>

                  {/* Tag Chips Shortcuts */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1.5rem' }}>
                    {slide.tagChips.map((chip, idx) => (
                      <Link 
                        key={idx} 
                        href={chip.link} 
                        className={`tag-chip ${chip.isLavender ? 'tag-chip-lavender' : ''}`}
                        style={{ textDecoration: 'none' }}
                      >
                        {chip.label}
                      </Link>
                    ))}
                  </div>

                </div>

                {/* Overlaid Image Panel */}
                <div style={{ position: 'relative', height: '420px', borderRadius: 'var(--radius-card)', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  
                  {/* Image Backdrop Gradient Card */}
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: 'var(--radius-card)', 
                    background: slide.imageGradient, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-soft)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <span style={{ 
                      fontFamily: 'var(--font-heading)', 
                      fontSize: '1.75rem', 
                      fontWeight: 800, 
                      color: slide.theme === 'dark' ? '#fff' : '#0d0c11',
                      opacity: 0.9,
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      letterSpacing: '-0.02em',
                      padding: '2rem'
                    }}>
                      {slide.imageText}
                    </span>
                  </div>

                  {/* Circular Nav overlays inside the Image */}
                  <div style={{ 
                    position: 'absolute', 
                    bottom: '1.5rem', 
                    left: '1.5rem', 
                    display: 'flex', 
                    gap: '0.5rem', 
                    zIndex: 10 
                  }}>
                    <button onClick={scrollPrev} className="icon-btn-pill" style={{ background: 'rgba(13, 12, 17, 0.4)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} aria-label="Previous slide">
                      &larr;
                    </button>
                    <button onClick={scrollNext} className="icon-btn-pill" style={{ background: 'rgba(13, 12, 17, 0.4)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }} aria-label="Next slide">
                      &rarr;
                    </button>
                  </div>

                  {/* Floating Price/Offer Badge */}
                  <div style={{
                    position: 'absolute',
                    top: '-15px',
                    right: '-15px',
                    background: 'var(--lime)',
                    color: '#0d0c11',
                    borderRadius: '50%',
                    width: '92px',
                    height: '92px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'rotate(12deg)',
                    boxShadow: 'var(--shadow-soft)',
                    zIndex: 15,
                    border: '3px solid var(--bg-dark)'
                  }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{slide.badgeText}</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900 }}>{slide.badgePrice}</span>
                  </div>

                </div>

              </div>

            </div>
          ))}
        </div>
      </div>

      {/* Pagination Dot Indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
        {scrollSnaps.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              border: 'none',
              background: selectedIndex === index ? 'var(--lime)' : 'rgba(232, 217, 245, 0.15)',
              cursor: 'pointer',
              transition: 'var(--transition)'
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Global layout for the split screen */}
      <style jsx global>{`
        .hero-split-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 4rem;
        }

        @media (max-width: 900px) {
          .hero-split-grid {
            grid-template-columns: 1fr;
            gap: 2.5rem;
          }
          /* Stack image first on mobile */
          .hero-split-grid > div:last-child {
            order: -1;
          }
        }
      `}</style>

    </div>
  )
}
