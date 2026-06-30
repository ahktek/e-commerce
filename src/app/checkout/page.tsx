'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

// Initialize Stripe client-side
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder')

interface Address {
  id: string
  label: string | null
  line1: string
  line2: string | null
  city: string
  state: string
  postal_code: string
  country: string
  is_default: boolean
}

function StripeCheckoutForm({
  cartId,
  clientSecret,
  totals,
  shippingAddressId
}: {
  cartId: string
  clientSecret: string
  totals: { subtotal_cents: number; tax_cents: number; shipping_cents: number; total_cents: number }
  shippingAddressId: string
}) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setErrorMessage(null)

    // Trigger form validation
    const { error: submitError } = await elements.submit()
    if (submitError) {
      setErrorMessage(submitError.message || 'An error occurred during submission')
      setLoading(false)
      return
    }

    // Confirm payment via Stripe. On success, Stripe will redirect to success page.
    const { error } = await stripe.confirmPayment({
      elements,
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success?cartId=${cartId}`,
      },
    })

    if (error) {
      setErrorMessage(error.message || 'Payment confirmation failed')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <PaymentElement />
      {errorMessage && (
        <div className="alert alert-error" style={{ fontSize: '0.85rem' }}>
          {errorMessage}
        </div>
      )}
      <button 
        type="submit" 
        className="btn btn-primary" 
        style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}
        disabled={!stripe || loading}
      >
        {loading ? 'Processing Payment...' : `Pay $${(totals.total_cents / 100).toFixed(2)}`}
      </button>
    </form>
  )
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const cartId = searchParams.get('cartId')
  const supabase = createClient()

  // State
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [totals, setTotals] = useState<any>(null)
  const [loadingSecret, setLoadingSecret] = useState(false)

  // Fetch addresses
  useEffect(() => {
    if (!cartId) {
      router.push('/cart')
      return
    }

    async function loadAddresses() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: addrs } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
        if (addrs) {
          setAddresses(addrs)
          const defaultAddr = addrs.find(a => a.is_default) || addrs[0]
          if (defaultAddr) setSelectedAddressId(defaultAddr.id)
        }
      }
    }
    loadAddresses()
  }, [supabase, cartId, router])

  // Initialize Stripe Payment Intent when address is selected
  useEffect(() => {
    if (!cartId || !selectedAddressId) return

    async function initPayment() {
      setLoadingSecret(true)
      try {
        const res = await fetch('/api/checkout/create-payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartId, shippingAddressId: selectedAddressId })
        })
        const data = await res.json()
        if (data.clientSecret) {
          setClientSecret(data.clientSecret)
          setTotals({
            subtotal_cents: data.subtotal_cents,
            tax_cents: data.tax_cents,
            shipping_cents: data.shipping_cents,
            total_cents: data.total_cents
          })
        } else {
          alert(data.error || 'Failed to initialize payment')
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingSecret(false)
      }
    }

    initPayment()
  }, [cartId, selectedAddressId])

  if (!cartId) return null

  return (
    <div className="container" style={{ paddingBottom: '6rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2.5rem' }}>Checkout</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '3rem', alignItems: 'start' }}>
        
        {/* Left Side: Address Selection and Stripe Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Address Card */}
          <div className="glass-card">
            <h2 style={{ marginBottom: '1rem' }}>Shipping Address</h2>
            {addresses.length === 0 ? (
              <div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>You do not have any saved addresses.</p>
                <Link href="/account" className="btn btn-secondary">Add Address in Account Panel</Link>
              </div>
            ) : (
              <div className="form-group">
                <label className="form-label" htmlFor="addressSelect">Select Delivery Address</label>
                <select 
                  id="addressSelect"
                  className="form-input"
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                >
                  {addresses.map(addr => (
                    <option key={addr.id} value={addr.id}>
                      {addr.label || 'Address'} - {addr.line1}, {addr.city}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Payment Card */}
          {selectedAddressId && (
            <div className="glass-card">
              <h2 style={{ marginBottom: '1.5rem' }}>Payment details</h2>
              {loadingSecret ? (
                <p style={{ color: 'var(--text-secondary)' }}>Initializing checkout fields...</p>
              ) : clientSecret && totals ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <StripeCheckoutForm 
                    cartId={cartId} 
                    clientSecret={clientSecret} 
                    totals={totals} 
                    shippingAddressId={selectedAddressId} 
                  />
                </Elements>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>Configure a shipping address to activate payment options.</p>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Totals Summary Drawer */}
        {totals && (
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3>Checkout Totals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Subtotal</span>
                <span>${(totals.subtotal_cents / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Estimated Tax (8%)</span>
                <span>${(totals.tax_cents / 100).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Shipping</span>
                <span>{totals.shipping_cents === 0 ? 'Free' : `$${(totals.shipping_cents / 100).toFixed(2)}`}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.25rem', color: 'var(--primary)' }}>
              <span>Total amount</span>
              <span>${(totals.total_cents / 100).toFixed(2)}</span>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading checkout window...</p>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
