import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import * as api from '../api/client'

const BrandingContext = createContext(null)

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    universityName: 'Universidad Nacional',
    systemName: 'Sistema de Colas',
    logoBase64: null,
    coverBase64: null,
    configured: false,
    loading: true,
  })

  const fetchSettings = useCallback(async () => {
    try {
      const data = await api.getSettings()
      if (data) {
        setBranding({
          universityName: data.universityName || 'Universidad Nacional',
          systemName: data.systemName || 'Sistema de Colas',
          logoBase64: data.logoBase64 || null,
          coverBase64: data.coverBase64 || null,
          configured: !!data.configured,
          loading: false,
        })
      } else {
        setBranding(prev => ({ ...prev, loading: false }))
      }
    } catch (err) {
      console.error('Fallo al cargar la configuración de branding:', err)
      // Si falla (p. ej. error de red antes de conmutar a mock), dejamos los defaults
      setBranding(prev => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    fetchSettings()
    
    // Escuchar cuando el cliente conmuta a modo Mock de forma automática,
    // para recargar los settings simulados.
    const handleOffline = () => {
      fetchSettings()
    }
    window.addEventListener('colasuni:backend-offline', handleOffline)
    return () => window.removeEventListener('colasuni:backend-offline', handleOffline)
  }, [fetchSettings])

  const updateBranding = useCallback(async (newData) => {
    const res = await api.saveSettings(newData)
    setBranding({
      universityName: res.universityName,
      systemName: res.systemName,
      logoBase64: res.logoBase64 || null,
      coverBase64: res.coverBase64 || null,
      configured: !!res.configured,
      loading: false,
    })
    return res
  }, [])

  return (
    <BrandingContext.Provider value={{ ...branding, updateBranding, refreshBranding: fetchSettings }}>
      {children}
    </BrandingContext.Provider>
  )
}

export function useBranding() {
  const context = useContext(BrandingContext)
  if (!context) {
    throw new Error('useBranding debe usarse dentro de <BrandingProvider>')
  }
  return context
}
