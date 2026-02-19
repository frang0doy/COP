'use client'

import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'

function toNumber(raw: string) {
  const s = String(raw || '').trim().replace(',', '.')
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

function parseM2PerUnitFromRendimiento(rendimiento?: string | null) {
  // Ej: "4 m² por bolsa de 30 kg."
  const text = String(rendimiento || '')
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*m²\s*por/i)
  return m ? toNumber(m[1]) : null
}

type AmountUnit = 'kg' | 'lt'

function parseAmountPerUnitFromText(text?: string | null): {
  amount: number | null
  unit: AmountUnit | null
} {
  // Ej: "Bolsa de 30 kg." / "Balde de 20 lt." / "15 m² por balde de 15 lt..."
  const t = String(text || '')

  const mKg = t.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i)
  if (mKg) return { amount: toNumber(mKg[1]), unit: 'kg' }

  const mLt = t.match(/(\d+(?:[.,]\d+)?)\s*(?:lt|l)\b/i)
  if (mLt) return { amount: toNumber(mLt[1]), unit: 'lt' }

  return { amount: null, unit: null }
}

function parseUnitLabelFromPresentacion(presentacion?: string | null) {
  const t = String(presentacion || '').trim().toLowerCase()
  if (!t) return null
  if (t.includes('bolsa')) return 'Bolsa'
  if (t.includes('balde')) return 'Balde'
  if (t.includes('lata')) return 'Lata'
  if (t.includes('botella')) return 'Botella'
  return null
}

export default function ConsumptionCalculatorModal(props: {
  open: boolean
  onClose: () => void
  technicalSummary?: {
    rendimiento?: string
    presentacion?: string
  } | null
  /** Defaults si no se puede leer de la ficha */
  defaultM2PerUnit?: number
  defaultKgPerUnit?: number
  defaultUnitLabel?: string
}) {
  const {
    open,
    onClose,
    technicalSummary,
    defaultM2PerUnit = 5,
    defaultKgPerUnit = 30,
    defaultUnitLabel = 'Bolsa de papel',
  } = props

  const [area, setArea] = useState<string>('')
  const [touched, setTouched] = useState(false)

  const parsedM2PerUnit = parseM2PerUnitFromRendimiento(technicalSummary?.rendimiento ?? null)
  const parsedFromPresentacion = parseAmountPerUnitFromText(technicalSummary?.presentacion ?? null)
  const parsedFromRendimiento = parseAmountPerUnitFromText(technicalSummary?.rendimiento ?? null)
  const parsedAmountPerUnit = parsedFromPresentacion.amount ?? parsedFromRendimiento.amount
  const parsedAmountUnit = parsedFromPresentacion.unit ?? parsedFromRendimiento.unit
  const parsedLabel = parseUnitLabelFromPresentacion(technicalSummary?.presentacion ?? null)

  const m2PerUnit = parsedM2PerUnit ?? defaultM2PerUnit
  const amountPerUnit = parsedAmountPerUnit ?? defaultKgPerUnit
  const amountUnit: AmountUnit = parsedAmountUnit ?? 'kg'
  const unitLabel = parsedLabel ? `${parsedLabel}` : defaultUnitLabel

  const areaNum = useMemo(() => {
    const n = toNumber(area)
    if (n === null) return null
    if (n <= 0) return null
    return n
  }, [area])

  const result = useMemo(() => {
    if (!touched) return null
    if (!areaNum) return null
    const units = Math.max(1, Math.ceil(areaNum / m2PerUnit))
    const totalAmount = Math.round(units * amountPerUnit * 100) / 100
    return { units, totalAmount }
  }, [touched, areaNum, m2PerUnit, amountPerUnit])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    // Reset al abrir
    setArea('')
    setTouched(false)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[1000]">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute inset-0 flex items-start justify-center px-4 py-10">
        <div className="w-[min(94vw,900px)] bg-white rounded-2xl shadow-2xl overflow-hidden border border-black/10">
          <div className="h-1 w-full bg-orange-500" />
          <div className="flex items-start justify-between gap-3 p-6 pb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Calculadora de consumo</h2>
              <p className="text-sm text-gray-700 mt-2">
                Esta calculadora es para ayudarte a realizar un cálculo aproximado de la cantidad de producto que
                necesitas para tu proyecto, el mismo no contempla el desperdicio de producto durante su aplicación.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 p-2 rounded-lg hover:bg-gray-100 transition"
              aria-label="Cerrar"
              title="Cerrar"
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="w-full sm:max-w-sm">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Area (m2):</label>
                <input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  inputMode="decimal"
                  placeholder=""
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 transition bg-white"
                />
              </div>
              <button
                type="button"
                onClick={() => setTouched(true)}
                className="w-full sm:w-auto px-10 py-3 rounded-full bg-orange-600 text-white font-bold border border-orange-600 hover:bg-orange-500 hover:border-orange-500 transition shadow-lg shadow-orange-500/15"
              >
                Calcular
              </button>
            </div>

            {touched ? (
              <div className="mt-6 bg-gray-50 rounded-2xl p-5 border border-gray-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Resultado</p>
                  <p className="text-xs text-gray-500">Aproximado</p>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Total</p>
                    <p className="mt-2 text-2xl font-extrabold text-gray-900">
                      {result ? `${result.totalAmount}` : '—'}{' '}
                      <span className="text-base font-bold text-gray-700">{amountUnit}</span>
                    </p>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase">Unidades</p>
                    <p className="mt-2 text-2xl font-extrabold text-gray-900">
                      {result ? `${result.units}` : '—'}{' '}
                      <span className="text-base font-bold text-gray-700">{unitLabel}</span>
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-700 mt-6 text-center leading-relaxed">
                  En colores claros, puede necesitar más cantidad. Esta calculadora se proporciona para ayudarlo a hacer
                  un cálculo aproximado de la cantidad de producto que necesita para completar su proyecto. Verifique con
                  el soporte técnico de <span className="font-semibold">COP</span> o su distribuidor antes de comprar.
                  Este resultado no tiene en cuenta las pérdidas de ningún producto durante el uso. Este resultado es solo
                  indicativo.
                </p>
              </div>
            ) : null}

            <p className="text-xs text-gray-500 mt-4">
              Referencia utilizada: {m2PerUnit} m² por unidad · {amountPerUnit} {amountUnit} por unidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

