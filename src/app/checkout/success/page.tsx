'use client'

import React, { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function SuccessContent() {
  const searchParams = useSearchParams()
  const cartId = searchParams.get('cartId')

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', padding: '6rem 1.5rem' }}>
      <div className="glass-card" style={{ maxWidth: '500px', width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
        
        {/* Success Icon */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(16, 185, 129, 0.1)',
          border: '2px solid var(--success)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--success)',
          fontSize: '2rem',
          fontWeight: 'bold'
        }}>
          ✓
        </div>

        <h1 style={{ fontSize: '2rem' }}>Payment Successful!</h1>
        
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
          Thank you for your purchase! Your payment has been securely processed. We are preparing your shipment now.
        </p>

        {cartId && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
            Checkout Session: {cartId}
          </p>
        )}

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', width: '100%' }}>
          <Link href="/account" className="btn btn-primary" style={{ flex: 1 }}>
            View Order History
          </Link>
          <Link href="/shop" className="btn btn-secondary" style={{ flex: 1 }}>
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Verifying transaction...</p>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
