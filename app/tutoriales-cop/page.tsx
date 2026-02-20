'use client'

import { useMemo, useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { motion } from 'framer-motion'

type Tutorial = {
  title: string
  description: string
  youtubeUrl: string
}

function getYoutubeId(url: string) {
  const raw = (url || '').trim()
  if (!raw) return null
  try {
    const u = new URL(raw)
    const host = u.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0]
      return id || null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/').filter(Boolean)
      const embedIdx = parts.indexOf('embed')
      if (embedIdx >= 0 && parts[embedIdx + 1]) return parts[embedIdx + 1]
      const shortsIdx = parts.indexOf('shorts')
      if (shortsIdx >= 0 && parts[shortsIdx + 1]) return parts[shortsIdx + 1]
    }
  } catch {
    // ignore
  }
  return null
}

export default function TutorialesCopPage() {
  // Pegá acá los videos (link YouTube + título + descripción).
  const tutorials: Tutorial[] = useMemo(
    () => [
      {
        title: 'Pintura ACRILPLUS 7000H',
        description:
          'Es una pintura lavable de excelente poder cubriente y gran resistencia al intemperismo. Se aplica fácilmente mediante rodillo o brocha sobre superficies de hormigón, yeso, aplanado tradicional, tablaroca, superficies metálicas o cualquier tipo de panelería ligera. Es una pintura recomendada para decorar y pintar áreas como cocina, baños, pasillos y muebles de madera ó metálicos por su fácil aplicación, tiempo de secado, fácil limpieza y bajo olor.',
        youtubeUrl: 'https://www.youtube.com/watch?v=yBgmyMXr9CY',
      },
      {
        title: 'Sistema Cop para recubrimiento de alberca',
        description:
          'Aplicación de recubrimientos decorativos ESTUCOP ALBERCA que combina agregados de carbonato de color natural, cemento portland blanco fortificado y polímeros hidrorepelentes, que al ser mezclado con agua y/o concentrado chukum logran un acabado único de gran resistencia y espectacular vista para pisos, muros y escaleras de albercas, jacuzzis, estanques, acuarios, fuentes y ríos artificiales, que da una apariencia al agua de azul o verde turquesa.',
        youtubeUrl: 'https://www.youtube.com/watch?v=diNZcES_y_w',
      },
      {
        title: 'Recubrimiento para plafones de poliestireno',
        description: 'Próximamente agregamos la descripción detallada.',
        youtubeUrl: 'https://www.youtube.com/watch?v=kDau_jiDAhA',
      },
      {
        title: 'Aplicación de ESTUCOP FINO, CHUKUM y concreto aparente sobre muro interior',
        description:
          'Aplicación de recubrimiento decorativo ESTUCOP FINO, el cual permite ser utilizado en acabados de alta calidad y belleza, muy similar al yeso tradicional, pero con mayor fortaleza por ser base cementosa; ESTUCOP CHUKUM, que sirve para la decoración en muros exteriores e interiores, dando a estos un aspecto natural con vetas de distintas tonalidades o intensidades; y concreto aparente sobre muros internos pintados.',
        youtubeUrl: 'https://www.youtube.com/watch?v=OxIL3WaqtBo',
      },
      {
        title: 'Aplicación de ESTUCOP FINO y CHUKUM sobre muro exterior',
        description:
          'Aplicación de recubrimiento decorativo ESTUCOP FINO, el cual permite ser utilizado en acabados de alta calidad y belleza, muy similar al yeso tradicional, pero con mayor fortaleza por ser base cementosa; ESTUCOP CHUKUM, que sirve para la decoración en muros exteriores e interiores, dando a estos un aspecto natural con vetas de distintas tonalidades o intensidades; y concreto aparente sobre muros externos pintados.',
        youtubeUrl: 'https://www.youtube.com/watch?v=JkGkwU4a9s0',
      },
    ],
    []
  )

  const [playingId, setPlayingId] = useState<string | null>(null)

  return (
    <main className="min-h-screen pt-24 bg-gray-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-xs font-semibold tracking-[0.25em] text-gray-600 uppercase">
            Sección nueva
          </p>
          <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold tracking-tight text-black">
            Tutoriales <span className="text-brand-orange">COP</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-gray-700 max-w-2xl">
            Acá vas a encontrar guías, tips y tutoriales para aplicar nuestros productos y sacarles el máximo provecho.
          </p>

          {tutorials.length === 0 ? (
            <div className="mt-10 bg-white border border-gray-200 p-6 md:p-8 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 rounded-full bg-orange-500" />
                <p className="text-sm md:text-base text-gray-800 font-semibold">
                  Pasame los links de YouTube, el título y la descripción de cada tutorial y los cargo acá.
                </p>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Quedan con miniatura, reproducción embebida y botón para verlo en YouTube.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {tutorials.map((t, i) => {
                const id = getYoutubeId(t.youtubeUrl)
                const isPlaying = Boolean(id && playingId === id)
                const thumbnail = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null
                const embed = id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null
                const isLastOdd = tutorials.length % 2 === 1 && i === tutorials.length - 1

                return (
                  <motion.div
                    key={`${t.title}-${i}`}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-120px' }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    className={[
                      'bg-white border border-gray-200 shadow-sm overflow-hidden',
                      isLastOdd ? 'md:col-span-2 md:max-w-[560px] md:mx-auto' : '',
                    ].join(' ')}
                  >
                    <div className="relative">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />

                      <div className="relative aspect-video bg-black">
                        {isPlaying && embed ? (
                          <iframe
                            className="absolute inset-0 h-full w-full"
                            src={embed}
                            title={t.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <>
                            {thumbnail ? (
                              // Usamos <img> para no depender de configuración de dominios en next/image
                              <img
                                src={thumbnail}
                                alt={`Miniatura: ${t.title}`}
                                className="absolute inset-0 h-full w-full object-cover"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
                                Link inválido de YouTube
                              </div>
                            )}

                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/5" />

                            {/* Solapa título */}
                            <div className="absolute left-4 top-4 right-4">
                              <div className="inline-flex max-w-full items-center gap-2 rounded-full bg-black/55 backdrop-blur px-3 py-1.5">
                                <span className="h-2 w-2 rounded-full bg-orange-500" />
                                <span className="text-xs sm:text-sm font-semibold text-white truncate">
                                  {t.title}
                                </span>
                              </div>
                            </div>

                            {/* Botón play */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => (id ? setPlayingId(id) : null)}
                                className="group inline-flex items-center gap-3 rounded-full bg-[#25D366]/0 px-4 py-3 text-white"
                                aria-label={`Reproducir: ${t.title}`}
                                disabled={!id}
                              >
                                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25 backdrop-blur group-hover:bg-white/20 transition">
                                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white" aria-hidden="true">
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </span>
                                <span className="hidden sm:block text-sm font-semibold drop-shadow">
                                  Reproducir
                                </span>
                              </button>
                            </div>

                            {/* CTA YouTube */}
                            <div className="absolute bottom-4 right-4">
                              <a
                                href={t.youtubeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center rounded-full bg-white/90 text-black text-xs font-semibold px-3 py-1.5 hover:bg-white transition"
                              >
                                Ver en YouTube
                              </a>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="p-5 md:p-6">
                      <h2 className="text-lg font-semibold text-black">{t.title}</h2>
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed">{t.description}</p>

                      {!isPlaying && id ? (
                        <button
                          type="button"
                          onClick={() => setPlayingId(id)}
                          className="mt-4 inline-flex items-center justify-center px-4 py-2 bg-orange-500 text-white border border-orange-500 hover:bg-orange-600 hover:border-orange-600 transition font-semibold text-sm"
                        >
                          Reproducir acá
                        </button>
                      ) : null}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
      <Footer />
    </main>
  )
}

