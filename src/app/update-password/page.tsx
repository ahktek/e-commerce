'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    feedback: string[];
  }>({ score: 0, feedback: [] })

  const supabase = createClient()

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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (passwordStrength.score < 5) {
      setMessage({
        type: 'error',
        text: `Please meet all password requirements: ${passwordStrength.feedback.join(', ')}`,
      })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({
          type: 'success',
          text: 'Password updated successfully! Redirecting...',
        })
        setTimeout(() => {
          router.push('/account')
        }, 2000)
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
          Update Password
        </h2>

        {message && (
          <div className={`alert alert-${message.type}`}>
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">New Password</label>
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

          {password && (
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
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
