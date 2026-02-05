'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

type CountryCode = 'AR' | 'MX' | 'CU'

const STORAGE_KEY = 'cop_country'

function getStoredCountry(): CountryCode | null {
  try {
    const v = (localStorage.getItem(STORAGE_KEY) || '').trim().toUpperCase()
    if (v === 'AR' || v === 'MX' || v === 'CU') return v
    return null
  } catch {
    return null
  }
}

function setStoredCountry(code: CountryCode) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // ignore
  }
  // También dejamos cookie para futuro uso server-side
  try {
    document.cookie = `cop_country=${code}; path=/; max-age=${60 * 60 * 24 * 365}`
  } catch {
    // ignore
  }
}

function Flag({ code }: { code: CountryCode }) {
  // SVGs simples (no oficiales), solo como ícono.
  if (code === 'AR') {
    return (
      <svg viewBox="0 0 28 20" className="w-7 h-5 shrink-0" aria-hidden="true">
        <rect width="28" height="20" fill="#74ACDF" />
        <rect y="6.66" width="28" height="6.66" fill="#FFFFFF" />
        <circle cx="14" cy="10" r="2.1" fill="#F6B40E" />
      </svg>
    )
  }
  if (code === 'MX') {
    return (
      <svg viewBox="0 0 28 20" className="w-7 h-5 shrink-0" aria-hidden="true">
        <rect width="28" height="20" fill="#FFFFFF" />
        <rect width="9.33" height="20" fill="#006847" />
        <rect x="18.66" width="9.34" height="20" fill="#CE1126" />
        <circle cx="14" cy="10" r="2.2" fill="#9C6B3E" opacity="0.85" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 28 20" className="w-7 h-5 shrink-0" aria-hidden="true">
      <rect width="28" height="20" fill="#FFFFFF" />
      <rect y="0" width="28" height="3.33" fill="#002A8F" />
      <rect y="6.66" width="28" height="3.33" fill="#002A8F" />
      <rect y="13.33" width="28" height="3.33" fill="#002A8F" />
      <path d="M0 0 L11 10 L0 20 Z" fill="#CF142B" />
      <circle cx="4.3" cy="10" r="1.2" fill="#FFFFFF" />
    </svg>
  )
}

function CountryButton(props: {
  code: CountryCode
  label: string
  enabled: boolean
  onSelect?: (code: CountryCode) => void
}) {
  const { code, label, enabled, onSelect } = props
  return (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => onSelect?.(code)}
      className={[
        'w-full border px-3.5 py-2.5 sm:px-4 sm:py-3 flex items-center justify-between gap-3 transition-colors',
        enabled
          ? 'border-gray-200 bg-white hover:border-orange-500 hover:bg-orange-50/50'
          : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed',
      ].join(' ')}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Flag code={code} />
        <div className="min-w-0 text-left">
          <p className={['font-semibold', enabled ? 'text-black' : 'text-gray-400'].join(' ')}>
            {label}
          </p>
          {!enabled ? (
            <p className="text-xs text-gray-400 mt-0.5">Próximamente disponible</p>
          ) : null}
        </div>
      </div>
      <span
        className={[
          'text-sm font-semibold',
          enabled ? 'text-orange-700' : 'text-gray-300',
        ].join(' ')}
      >
        Elegir
      </span>
    </button>
  )
}

export default function CountryGate() {
  const [country, setCountry] = useState<CountryCode | null>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setCountry(getStoredCountry())
    setHydrated(true)
  }, [])

  const isOpen = useMemo(() => hydrated && !country, [hydrated, country])

  useEffect(() => {
    if (!isOpen) return
    const prevHtml = document.documentElement.style.overflow
    const prevBody = document.body.style.overflow
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = prevHtml
      document.body.style.overflow = prevBody
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Fondo */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-neutral-900" />
        <div className="absolute inset-0 opacity-[0.14]">
          <div className="absolute -top-24 -left-24 w-80 h-80 bg-orange-500 blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-orange-600 blur-3xl" />
        </div>

        <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <motion.div
            className="w-full max-w-xl"
            initial={{ opacity: 0, y: 18, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative w-44 h-20 sm:w-72 sm:h-28">
                <Image
                  src="/images/logocop.png"
                  alt="COP"
                  fill
                  className="object-contain drop-shadow-2xl"
                  priority
                  unoptimized
                />
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden">
              <div className="h-1 w-full bg-orange-500" />
              <div className="p-5 sm:p-8">
                <p className="text-xs font-semibold tracking-[0.25em] text-gray-600 uppercase text-center sm:text-left">
                  Antes de comenzar
                </p>
                <h1 className="text-xl sm:text-3xl font-semibold text-black mt-2 text-center sm:text-left">
                  ¿Dónde querés comprar?
                </h1>
                <p className="text-sm text-gray-700 mt-2 text-center sm:text-left">
                  Elegí tu país para ver precios y datos correspondientes. Por ahora está disponible Argentina.
                </p>

                <div className="mt-5 sm:mt-6 space-y-2.5 sm:space-y-3">
                  <CountryButton
                    code="AR"
                    label="Argentina"
                    enabled
                    onSelect={(c) => {
                      setStoredCountry(c)
                      setCountry(c)
                    }}
                  />
                  <CountryButton code="MX" label="México" enabled={false} />
                  <CountryButton code="CU" label="Cuba" enabled={false} />
                </div>

                <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-200 text-center sm:text-left">
                  <p className="text-xs text-gray-600">
                    México y Cuba: <span className="font-semibold">Próximamente disponible</span>.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-white/50 mt-6 text-center">
              COP Recubrimientos · Selección de país
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

