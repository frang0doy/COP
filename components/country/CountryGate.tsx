'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { useSession } from 'next-auth/react'

type Props = {
  initialGateOpen: boolean
}

type Mode = 'gate' | 'picker'

function getCookie(name: string) {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()!.split(';').shift() ?? null
  return null
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax`
}

const COUNTRY_LABEL: Record<string, string> = {
  AR: 'Argentina',
  MX: 'México',
  CU: 'Cuba',
}

function FlagIcon({ code }: { code: 'AR' | 'MX' | 'CU' }) {
  // SVGs simples (evita depender de emojis/fonts del sistema).
  if (code === 'AR') {
    return (
      <svg viewBox="0 0 64 64" className="h-6 w-6" aria-label="Bandera Argentina" role="img">
        <defs>
          <clipPath id="c">
            <circle cx="32" cy="32" r="30" />
          </clipPath>
        </defs>
        <g clipPath="url(#c)">
          <rect x="0" y="0" width="64" height="64" fill="#74ACDF" />
          <rect x="0" y="21.3" width="64" height="21.3" fill="#FFFFFF" />
          {/* sol simplificado */}
          <circle cx="32" cy="32" r="5.2" fill="#F6B40E" />
        </g>
        <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="2" />
      </svg>
    )
  }

  if (code === 'MX') {
    return (
      <svg viewBox="0 0 64 64" className="h-6 w-6" aria-label="Bandera México" role="img">
        <defs>
          <clipPath id="c">
            <circle cx="32" cy="32" r="30" />
          </clipPath>
        </defs>
        <g clipPath="url(#c)">
          <rect x="0" y="0" width="21.3" height="64" fill="#006847" />
          <rect x="21.3" y="0" width="21.4" height="64" fill="#FFFFFF" />
          <rect x="42.7" y="0" width="21.3" height="64" fill="#CE1126" />
          {/* escudo simplificado */}
          <circle cx="32" cy="32" r="4.2" fill="#7B4A12" opacity="0.45" />
        </g>
        <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="2" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 64 64" className="h-6 w-6" aria-label="Bandera Cuba" role="img">
      <defs>
        <clipPath id="c">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <g clipPath="url(#c)">
        <rect x="0" y="0" width="64" height="64" fill="#FFFFFF" />
        <rect x="0" y="0" width="64" height="10.7" fill="#002A8F" />
        <rect x="0" y="21.3" width="64" height="10.7" fill="#002A8F" />
        <rect x="0" y="42.7" width="64" height="10.7" fill="#002A8F" />
        <path d="M0 0 L34 32 L0 64 Z" fill="#CF142B" />
        {/* estrella simplificada */}
        <circle cx="13.5" cy="32" r="3.1" fill="#FFFFFF" />
      </g>
      <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(0,0,0,0.10)" strokeWidth="2" />
    </svg>
  )
}

export default function CountryGate({ initialGateOpen }: Props) {
  const { status } = useSession()

  const [open, setOpen] = useState<boolean>(initialGateOpen)
  const [mode, setMode] = useState<Mode>(initialGateOpen ? 'gate' : 'picker')
  const [mounted, setMounted] = useState(false)

  const COUNTRY_CONFIRM_KEY = 'cop.country.confirmed'

  const hasSelectedCountry = () => {
    const fromCookie = getCookie('cop.country')
    if (fromCookie) return true
    try {
      return Boolean(localStorage.getItem('cop.country'))
    } catch {
      return false
    }
  }

  const selectedCountry = useMemo(() => {
    // Preferimos cookie (usable por server/client). También espejamos en localStorage para lecturas rápidas.
    const fromCookie = getCookie('cop.country')
    if (fromCookie) return decodeURIComponent(fromCookie)
    try {
      return localStorage.getItem('cop.country')
    } catch {
      return null
    }
  }, [open]) // recalcula cuando se abre/cierra

  useEffect(() => {
    setMounted(true)
  }, [])

  // Requisito de UX: al entrar a la web, lo primero es elegir país.
  // Para evitar que se muestre en bucle, lo pedimos 1 vez por sesión de navegador (sessionStorage).
  useEffect(() => {
    if (!mounted) return
    try {
      const confirmed = sessionStorage.getItem(COUNTRY_CONFIRM_KEY) === '1'
      if (!confirmed) {
        setMode('gate')
        setOpen(true)
      }
    } catch {
      // Si sessionStorage no está disponible, fallback: usar la lógica normal.
    }
  }, [mounted])

  // Sincronizar con el server cuando cambia la sesión / layout (por ejemplo, después de iniciar sesión).
  useEffect(() => {
    if (!mounted) return
    if (initialGateOpen && !hasSelectedCountry()) {
      setMode('gate')
      setOpen(true)
      return
    }
    // Si el gate ya no es necesario, lo cerramos solo si estábamos en modo gate obligatorio.
    if (!initialGateOpen && mode === 'gate') {
      setOpen(false)
      setMode('picker')
    }
  }, [initialGateOpen, mounted, mode])

  // Abrir desde cualquier parte de la UI (ej: Navbar "Cambiar país")
  useEffect(() => {
    if (!mounted) return
    const onOpen = () => {
      setMode('picker')
      setOpen(true)
    }
    window.addEventListener('cop:open-country-picker' as any, onOpen as any)
    return () => window.removeEventListener('cop:open-country-picker' as any, onOpen as any)
  }, [mounted])

  // Bloquear scroll cuando el modal está abierto
  useEffect(() => {
    if (!mounted) return
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, mounted])

  const chooseArgentina = async () => {
    setCookie('cop.country', 'AR', 365)
    try {
      localStorage.setItem('cop.country', 'AR')
    } catch {}
    try {
      sessionStorage.setItem(COUNTRY_CONFIRM_KEY, '1')
    } catch {}
    try {
      window.dispatchEvent(new CustomEvent('cop:country-changed', { detail: { country: 'AR' } }))
    } catch {}

    // Si ya está logueado, persistimos en DB
    if (status === 'authenticated') {
      const res = await fetch('/api/me/country', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: 'AR' }),
      })
      // Si falla, igual dejamos pasar: el gate volverá a aparecer al recargar hasta que se guarde.
      void res
    }

    setOpen(false)
  }

  if (!mounted) return null
  if (!open) return null

  const title = mode === 'gate' ? 'Antes de comenzar' : 'Cambiar país'
  const subtitle =
    mode === 'gate'
      ? 'Elegí tu país para ver precios y datos correspondientes.'
      : 'Podés cambiar tu país cuando quieras.'

  const modal = (
    <div className="fixed inset-0 z-[1000]">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-black"
        onClick={() => {
          if (mode === 'picker') setOpen(false)
        }}
      />

      {/* Efectos naranja difuminados (nube en bordes) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 -left-28 h-[420px] w-[420px] rounded-full bg-orange-500/14 blur-[130px]" />
        <div className="absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-orange-500/10 blur-[160px]" />
        <div className="absolute -bottom-40 -left-40 h-[520px] w-[520px] rounded-full bg-orange-500/10 blur-[160px]" />
        <div className="absolute -bottom-28 -right-28 h-[420px] w-[420px] rounded-full bg-orange-500/14 blur-[130px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/6 via-transparent to-orange-500/6" />
      </div>

      {/* Contenido */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <div className="w-[min(92vw,720px)]">
          <div className="flex justify-center mb-7">
            <div className="relative">
              {/* glow naranja detrás del logo */}
              <div className="absolute inset-0 -z-10 scale-110 rounded-full bg-orange-500/18 blur-[55px]" />
              <Image
                src="/images/logocop.png"
                alt="COP"
                width={240}
                height={96}
                className="object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.55)]"
                priority
                unoptimized
              />
            </div>
          </div>

          <div className="bg-white border border-black/10 shadow-2xl">
            <div className="h-1 bg-orange-500" />
            <div className="p-7 sm:p-8">
              <p className="text-xs font-semibold tracking-[0.25em] text-black/60 uppercase">
                {title}
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-black mt-2">
                ¿Dónde querés comprar?
              </h2>
              <p className="text-sm text-black/70 mt-2">{subtitle}</p>
              <p className="text-xs text-black/60 mt-1">
                Por ahora está disponible <span className="font-semibold">Argentina</span>.
              </p>

              <div className="mt-6 space-y-3">
                {/* Argentina */}
                <button
                  type="button"
                  onClick={chooseArgentina}
                  className="w-full flex items-center justify-between px-4 py-3 border border-black/10 hover:border-orange-500 hover:bg-orange-500/5 transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-black/10 shadow-sm"
                    >
                      <FlagIcon code="AR" />
                    </span>
                    <div className="text-left">
                      <div className="text-base font-semibold text-black">Argentina</div>
                      <div className="text-xs text-black/60">Disponible</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-orange-600">Elegir</span>
                </button>

                {/* México (deshabilitado) */}
                <div className="w-full flex items-center justify-between px-4 py-3 border border-black/10 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-black/10 shadow-sm"
                    >
                      <FlagIcon code="MX" />
                    </span>
                    <div className="text-left">
                      <div className="text-base font-semibold text-black">México</div>
                      <div className="text-xs text-black/60">Próximamente disponible</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-black/40">Elegir</span>
                </div>

                {/* Cuba (deshabilitado) */}
                <div className="w-full flex items-center justify-between px-4 py-3 border border-black/10 opacity-50 cursor-not-allowed">
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border border-black/10 shadow-sm"
                    >
                      <FlagIcon code="CU" />
                    </span>
                    <div className="text-left">
                      <div className="text-base font-semibold text-black">Cuba</div>
                      <div className="text-xs text-black/60">Próximamente disponible</div>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-black/40">Elegir</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <p className="text-xs text-black/60">
                  México y Cuba: <span className="font-semibold">próximamente</span>.
                </p>
                <p className="text-xs text-black/50">
                  {selectedCountry ? `Seleccionado: ${COUNTRY_LABEL[selectedCountry] ?? selectedCountry}` : ''}
                </p>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-white/60 mt-5">
            COP Revestimientos — Selección de país
          </p>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : null
}

