'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: string
  default_address_id: string | null
}

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

interface Order {
  id: string
  status: string
  total_cents: number
  created_at: string
}

interface WishlistItem {
  id: string
  product: {
    id: string
    name: string
    price_cents: number
    image_urls: string[]
  }
}

export default function AccountPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)

  // Addresses state
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressLabel, setAddressLabel] = useState('')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [addressCity, setAddressCity] = useState('')
  const [addressState, setAddressState] = useState('')
  const [addressPostalCode, setAddressPostalCode] = useState('')
  const [addressCountry, setAddressCountry] = useState('')
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null)
  const [addressMessage, setAddressMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [addressFormOpen, setAddressFormOpen] = useState(false)

  // Orders and Wishlist state
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])

  // Active Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'orders' | 'wishlist'>('profile')

  useEffect(() => {
    async function loadData() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.push('/login')
          return
        }
        setUser(authUser)

        // Fetch profile
        const { data: profileData, error: profileErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (profileData) {
          setProfile(profileData)
          setFullName(profileData.full_name || '')
          setPhone(profileData.phone || '')
          setAvatarUrl(profileData.avatar_url || '')
        }

        // Fetch addresses
        const { data: addressesData } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', authUser.id)
        if (addressesData) setAddresses(addressesData)

        // Fetch orders
        const { data: ordersData } = await supabase
          .from('orders')
          .select('id, status, total_cents, created_at')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
        if (ordersData) setOrders(ordersData)

        // Fetch wishlist with details
        const { data: wishlistData } = await supabase
          .from('wishlists')
          .select('id, product:products(id, name, price_cents, image_urls)')
          .eq('user_id', authUser.id)
        if (wishlistData) setWishlist(wishlistData as any)

      } catch (err) {
        console.error('Error loading account data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, supabase])

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setProfileSaving(true)
    setProfileMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl,
      })
      .eq('id', user.id)

    if (error) {
      setProfileMessage({ type: 'error', text: error.message })
    } else {
      setProfileMessage({ type: 'success', text: 'Profile updated successfully!' })
      setProfile({
        ...profile!,
        full_name: fullName,
        phone: phone,
        avatar_url: avatarUrl
      })
    }
    setProfileSaving(false)
  }

  // Address Add / Edit
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setAddressMessage(null)

    const addressPayload = {
      user_id: user.id,
      label: addressLabel,
      line1: addressLine1,
      line2: addressLine2 || null,
      city: addressCity,
      state: addressState,
      postal_code: addressPostalCode,
      country: addressCountry,
    }

    if (editingAddressId) {
      const { data, error } = await supabase
        .from('addresses')
        .update(addressPayload)
        .eq('id', editingAddressId)
        .select()
        .single()

      if (error) {
        setAddressMessage({ type: 'error', text: error.message })
      } else if (data) {
        setAddresses(addresses.map(addr => addr.id === editingAddressId ? data : addr))
        setAddressMessage({ type: 'success', text: 'Address updated!' })
        resetAddressForm()
      }
    } else {
      // If first address, make it default
      const isDefault = addresses.length === 0
      const { data, error } = await supabase
        .from('addresses')
        .insert({ ...addressPayload, is_default: isDefault })
        .select()
        .single()

      if (error) {
        setAddressMessage({ type: 'error', text: error.message })
      } else if (data) {
        setAddresses([...addresses, data])
        if (isDefault) {
          await supabase.from('profiles').update({ default_address_id: data.id }).eq('id', user.id)
          setProfile({ ...profile!, default_address_id: data.id })
        }
        setAddressMessage({ type: 'success', text: 'Address saved!' })
        resetAddressForm()
      }
    }
  }

  // Set Address as Default
  const handleSetDefaultAddress = async (addressId: string) => {
    if (!user) return
    const { error } = await supabase
      .from('profiles')
      .update({ default_address_id: addressId })
      .eq('id', user.id)

    if (error) {
      setAddressMessage({ type: 'error', text: error.message })
    } else {
      setAddresses(addresses.map(addr => ({ ...addr, is_default: addr.id === addressId })))
      setProfile({ ...profile!, default_address_id: addressId })
      setAddressMessage({ type: 'success', text: 'Default address updated!' })
    }
  }

  // Delete Address
  const handleDeleteAddress = async (addressId: string) => {
    const { error } = await supabase
      .from('addresses')
      .delete()
      .eq('id', addressId)

    if (error) {
      setAddressMessage({ type: 'error', text: error.message })
    } else {
      setAddresses(addresses.filter(addr => addr.id !== addressId))
      setAddressMessage({ type: 'success', text: 'Address deleted.' })
      if (profile?.default_address_id === addressId) {
        setProfile({ ...profile!, default_address_id: null })
      }
    }
  }

  const handleEditAddressClick = (addr: Address) => {
    setEditingAddressId(addr.id)
    setAddressLabel(addr.label || '')
    setAddressLine1(addr.line1)
    setAddressLine2(addr.line2 || '')
    setAddressCity(addr.city)
    setAddressState(addr.state)
    setAddressPostalCode(addr.postal_code)
    setAddressCountry(addr.country)
    setAddressFormOpen(true)
  }

  const resetAddressForm = () => {
    setEditingAddressId(null)
    setAddressLabel('')
    setAddressLine1('')
    setAddressLine2('')
    setAddressCity('')
    setAddressState('')
    setAddressPostalCode('')
    setAddressCountry('')
    setAddressFormOpen(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading account data...</p>
      </div>
    )
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', gap: '2rem', flexDirection: 'column' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Account</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your profile, addresses, and track your orders</p>
        </div>

        {/* Tab navigation */}
        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '1rem' }}>
          {(['profile', 'addresses', 'orders', 'wishlist'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="glass-card">
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Edit Profile Information</h2>
              {profileMessage && (
                <div className={`alert alert-${profileMessage.type}`}>
                  <span>{profileMessage.text}</span>
                </div>
              )}
              <form onSubmit={handleSaveProfile} style={{ maxWidth: '600px' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="fullName">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    className="form-input"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="avatarUrl">Avatar URL</label>
                  <input
                    id="avatarUrl"
                    type="text"
                    className="form-input"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                  {profileSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {activeTab === 'addresses' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>My Addresses</h2>
                <button onClick={() => { resetAddressForm(); setAddressFormOpen(!addressFormOpen) }} className="btn btn-primary">
                  {addressFormOpen ? 'Cancel' : 'Add New Address'}
                </button>
              </div>

              {addressMessage && (
                <div className={`alert alert-${addressMessage.type}`}>
                  <span>{addressMessage.text}</span>
                </div>
              )}

              {addressFormOpen && (
                <form onSubmit={handleSaveAddress} style={{ maxWidth: '600px', marginBottom: '2rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-glass)' }}>
                  <h3>{editingAddressId ? 'Edit Address' : 'New Address'}</h3>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label className="form-label">Label (e.g. Home, Work)</label>
                    <input type="text" className="form-input" value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} placeholder="Home" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address Line 1</label>
                    <input type="text" className="form-input" required value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address Line 2</label>
                    <input type="text" className="form-input" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input type="text" className="form-input" required value={addressCity} onChange={(e) => setAddressCity(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input type="text" className="form-input" required value={addressState} onChange={(e) => setAddressState(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Postal Code</label>
                      <input type="text" className="form-input" required value={addressPostalCode} onChange={(e) => setAddressPostalCode(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country</label>
                      <input type="text" className="form-input" required value={addressCountry} onChange={(e) => setAddressCountry(e.target.value)} />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-primary">
                    {editingAddressId ? 'Update Address' : 'Add Address'}
                  </button>
                </form>
              )}

              {addresses.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>You don&apos;t have any addresses saved yet.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {addresses.map((addr) => (
                    <div key={addr.id} className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 'bold' }}>{addr.label || 'Address'}</span>
                        {addr.is_default && <span className="badge badge-success">Default</span>}
                      </div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                        <div>{addr.line1}</div>
                        {addr.line2 && <div>{addr.line2}</div>}
                        <div>{addr.city}, {addr.state} {addr.postal_code}</div>
                        <div>{addr.country}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
                        {!addr.is_default && (
                          <button onClick={() => handleSetDefaultAddress(addr.id)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                            Set Default
                          </button>
                        )}
                        <button onClick={() => handleEditAddressClick(addr)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                          Edit
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>Order History</h2>
              {orders.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>You haven&apos;t placed any orders yet.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '1rem' }}>Order ID</th>
                        <th style={{ padding: '1rem' }}>Date</th>
                        <th style={{ padding: '1rem' }}>Status</th>
                        <th style={{ padding: '1rem' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid var(--border-glass)' }}>
                          <td style={{ padding: '1rem', fontFamily: 'monospace' }}>{order.id}</td>
                          <td style={{ padding: '1rem' }}>{new Date(order.created_at).toLocaleDateString()}</td>
                          <td style={{ padding: '1rem' }}>
                            <span className={`badge badge-${order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'error' : 'warning'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td style={{ padding: '1rem' }}>${(order.total_cents / 100).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'wishlist' && (
            <div>
              <h2 style={{ marginBottom: '1.5rem' }}>My Wishlist</h2>
              {wishlist.length === 0 ? (
                <p style={{ color: 'var(--text-secondary)' }}>Your wishlist is empty.</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem' }}>
                  {wishlist.map((item) => (
                    <div key={item.id} className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.product.image_urls?.[0] ? (
                          <img src={item.product.image_urls[0]} alt={item.product.name} style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>No Image</span>
                        )}
                      </div>
                      <h4 style={{ fontSize: '1rem', marginTop: '0.5rem' }}>{item.product.name}</h4>
                      <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                        ${(item.product.price_cents / 100).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
