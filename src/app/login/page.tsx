'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? '/account'
  const errorParam = searchParams.get('error')

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    errorParam ? { type: 'error', text: errorParam } : null
  )
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] })

  const supabase = createClient()

  // Client-side password strength check
  useEffect(() => {
    if (!password) {
      setPasswordStrength({ score: 0, feedback: [] })
      return
    }

    const feedback: string[] = []
    let score = 0

    if (password.length >= 8) {
      score += 1
    } else {
      feedback.push('At least 8 characters long')
    }

    if (/[A-Z]/.test(password)) {
      score += 1
    } else {
      feedback.push('At least one uppercase letter')
    }

    if (/[a-z]/.test(password)) {
      score += 1
    } else {
      feedback.push('At least one lowercase letter')
    }

    if (/[0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('At least one number')
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1
    } else {
      feedback.push('At least one special character')
    }

    setPasswordStrength({ score, feedback })
  }, [password])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    // Securely check password strength for signup
    if (isSignUp && passwordStrength.score < 5) {
      setMessage({
        type: 'error',
        text: `Please meet all password requirements: ${passwordStrength.feedback.join(', ')}`,
      })
      setLoading(false)
      return
    }

    try {
      if (isSignUp) {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'customer',
            },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
          },
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else if (data.user && data.session === null) {
          // Email confirmation enabled in Supabase settings
          setMessage({
            type: 'success',
            text: 'Sign up successful! Please check your email for the confirmation link.',
          })
        } else {
          await fetch('/api/cart/merge', { method: 'POST' })
          router.push(redirectTo)
          router.refresh()
        }
      } else {
        // Sign In
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setMessage({ type: 'error', text: error.message })
        } else {
          await fetch('/api/cart/merge', { method: 'POST' })
          router.push(redirectTo)
          router.refresh()
        }
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="glass-card auth-card">
        <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.75rem' }}>
          {isSignUp ? 'Create your Account' : 'Welcome Back'}
        </h2>

        {message && (
          <div className={`alert alert-${message.type}`}>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                className="form-input"
                placeholder="John Doe"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {isSignUp && password && (
            <div style={{ marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Password Strength:</span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: passwordStrength.score === 5 ? 'var(--success)' : 'var(--error)' 
                }}>
                  {passwordStrength.score === 5 ? 'Strong' : 'Weak'}
                </span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${(passwordStrength.score / 5) * 100}%`, 
                  background: passwordStrength.score === 5 ? 'var(--success)' : 'var(--error)',
                  transition: 'var(--transition)'
                }} />
              </div>
              {passwordStrength.feedback.length > 0 && (
                <ul style={{ marginTop: '0.5rem', color: 'var(--text-muted)', paddingLeft: '1.25rem' }}>
                  {passwordStrength.feedback.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ width: '100%', border: 'none', background: 'none' }}
            onClick={() => {
              setIsSignUp(!isSignUp)
              setMessage(null)
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>

        {!isSignUp && (
          <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
            <Link href="/reset-password" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading authentication...</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
