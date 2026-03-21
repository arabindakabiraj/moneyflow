  /**
 * useInstallPrompt.js — PWA install prompt hook
 * Captures beforeinstallprompt event and provides install API
 */
import { useState, useEffect, useCallback } from 'react'

const DISMISS_KEY = 'mf_pwa_dismiss'
const DISMISS_DAYS = 7

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    const ts = localStorage.getItem(DISMISS_KEY)
    if (!ts) return false
    const diff = Date.now() - Number(ts)
    return diff < DISMISS_DAYS * 24 * 60 * 60 * 1000
  })

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    const installedHandler = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', installedHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', installedHandler)
    }
  }, [])

  const canInstall = !!deferredPrompt && !isInstalled && !dismissed

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    return outcome === 'accepted'
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    setDismissed(true)
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
  }, [])

  return { canInstall, isInstalled, promptInstall, dismiss }
}