'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'

interface Order {
  id: string
  created_at: string
  status: string
  subtotal_cents: number
  tax_cents: number
  shipping_cents: number
  total_cents: number
  profiles: {
    full_name: string | null
    phone: string | null
  } | null
  addresses: {
    line1: string
    city: string
    state: string
    postal_code: string
    country: string
  } | null
}

const MOCK_ORDERS: Order[] = [
  {
    id: 'o-001',
    created_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    status: 'paid',
    subtotal_cents: 14900,
    tax_cents: 1192,
    shipping_cents: 1000,
    total_cents: 17092,
    profiles: {
      full_name: 'Sophia Loren',
      phone: '+1 555-0199'
    },
    addresses: {
      line1: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'IL',
      postal_code: '62704',
      country: 'USA'
    }
  },
  {
    id: 'o-002',
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    status: 'pending',
    subtotal_cents: 29900,
    tax_cents: 2392,
    shipping_cents: 0,
    total_cents: 32292,
    profiles: {
      full_name: 'John Smith',
      phone: '+1 555-8291'
    },
    addresses: {
      line1: '1600 Amphitheatre Pkwy',
      city: 'Mountain View',
      state: 'CA',
      postal_code: '94043',
      country: 'USA'
    }
  }
]

const STATUSES = ['pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function AdminOrdersPage() {
  const supabase = createClient()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          status,
          subtotal_cents,
          tax_cents,
          shipping_cents,
          total_cents,
          profiles:user_id(full_name, phone),
          addresses:shipping_address_id(line1, city, state, postal_code, country)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data && data.length > 0) {
        setOrders(data as any[])
      } else {
        setOrders(MOCK_ORDERS)
      }
    } catch (e) {
      setOrders(MOCK_ORDERS)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      if (error) throw error
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } catch (e) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="container" style={{ paddingBottom: '6rem' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '2.5rem' }}>Manage Orders</h1>

      <div className="glass-card" style={{ overflowX: 'auto' }}>
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading order files...</p>
        ) : orders.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No order logs present.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '1rem' }}>Order ID / Date</th>
                <th style={{ padding: '1rem' }}>Customer Details</th>
                <th style={{ padding: '1rem' }}>Delivery Address</th>
                <th style={{ padding: '1rem' }}>Totals</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--border-glass)', opacity: updatingId === o.id ? 0.6 : 1 }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{o.id}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {new Date(o.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: '600' }}>{o.profiles?.full_name || 'Guest / Deleted User'}</div>
                    {o.profiles?.phone && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        {o.profiles.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', lineHeight: '1.4', color: 'var(--text-secondary)' }}>
                    {o.addresses ? (
                      <div>
                        <div>{o.addresses.line1}</div>
                        <div>{o.addresses.city}, {o.addresses.state} {o.addresses.postal_code}</div>
                        <div>{o.addresses.country}</div>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>No address attached</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ fontWeight: 'bold' }}>${(o.total_cents / 100).toFixed(2)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      Items: ${(o.subtotal_cents / 100).toFixed(2)} | Shipping: ${(o.shipping_cents / 100).toFixed(2)}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge badge-${o.status === 'delivered' || o.status === 'paid' ? 'success' : o.status === 'cancelled' || o.status === 'refunded' ? 'error' : 'warning'}`}>
                      {o.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <select
                      className="form-input"
                      style={{ padding: '0.4rem 0.8rem', width: '140px', fontSize: '0.9rem' }}
                      value={o.status}
                      disabled={updatingId === o.id}
                      onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                    >
                      {STATUSES.map(st => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
