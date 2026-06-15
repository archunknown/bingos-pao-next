'use client'

import { motion } from 'framer-motion'
import { useRouter, usePathname } from 'next/navigation'

export default function GanadoresPublicoClient({ ganadores, sorteos, filtroSorteoId }) {
  const router = useRouter()

  function filtrar(sorteoId) {
    const params = sorteoId ? `?sorteo_id=${sorteoId}` : ''
    router.push(`/ganadores${params}`)
  }

  const sorteoReciente = ganadores.length > 0 ? ganadores[0]?.sorteo : null

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'url(/ganadores-bg.webp)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(6px)', transform: 'scale(1.05)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'rgba(10,10,10,0.78)' }} />

      <div className="relative mx-auto max-w-5xl px-4 py-12 md:py-16">
        {/* Banner sorteo más reciente */}
        {sorteoReciente && !filtroSorteoId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            className="mb-8 flex items-center gap-3 border border-gold/30 bg-gold/5 px-5 py-3"
          >
            <span className="text-gold">★</span>
            <span className="text-sm text-muted">
              Último sorteo con resultados: <span className="font-semibold text-cream">{sorteoReciente}</span>
            </span>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="mb-10 flex flex-wrap items-end justify-between gap-6"
        >
          <div>
            <h1 className="border-l-4 border-gold pl-4 font-display text-5xl text-cream">GANADORES</h1>
            <p className="mt-2 pl-5 text-sm text-muted">Resultados oficiales de nuestros sorteos</p>
          </div>

          {sorteos.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={filtroSorteoId ?? ''}
                  onChange={e => filtrar(e.target.value || null)}
                  className="cursor-pointer appearance-none border border-gold/20 bg-surface2 py-2.5 pl-4 pr-8 text-sm text-cream outline-none transition-colors focus:border-gold"
                >
                  <option value="">Todos los sorteos</option>
                  {sorteos.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </select>
                <svg className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {filtroSorteoId && (
                <button type="button" onClick={() => filtrar(null)}
                  className="border border-gold/30 px-3 py-2.5 text-sm text-muted transition-colors hover:text-gold">
                  ✕ Limpiar
                </button>
              )}
            </div>
          )}
        </motion.div>

        {/* Grid */}
        {ganadores.length === 0 ? (
          <EmptyState filtrado={!!filtroSorteoId} onLimpiar={() => filtrar(null)} />
        ) : (
          <motion.div
            key={String(filtroSorteoId ?? 'all')}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.09 } } }}
            initial="hidden" animate="visible"
          >
            {ganadores.map(g => (
              <motion.div key={g.id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } }}>
                <GanadorCard ganador={g} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function GanadorCard({ ganador }) {
  const { palette } = ganador
  return (
    <div className="relative flex flex-col overflow-hidden border border-gold/20 bg-surface p-5 transition-colors hover:border-gold/50">
      {/* Cinta diagonal GANADOR */}
      <div className="pointer-events-none absolute right-0 top-0 h-16 w-16 overflow-hidden">
        <div className="absolute bg-gold text-center text-[7px] font-bold uppercase tracking-widest text-bg"
          style={{ width: '80px', right: '-20px', top: '14px', transform: 'rotate(45deg)', padding: '2px 0' }}>
          GANADOR
        </div>
      </div>

      <div className="flex items-center gap-3">
        <motion.div
          className="flex size-11 shrink-0 items-center justify-center border border-gold/30 text-base font-bold"
          style={{ backgroundColor: palette.bg, color: palette.text }}
          whileHover={{ rotate: 5, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        >
          {ganador.inicial}
        </motion.div>
        <div className="min-w-0 pr-8">
          <p className="truncate font-semibold text-cream">{ganador.nombre}</p>
          {ganador.sorteo && <p className="truncate text-xs text-muted">{ganador.sorteo}</p>}
        </div>
      </div>

      <div className="my-4 h-px bg-gold/10" />

      <div className="flex-1 space-y-2">
        {ganador.monto != null && (
          <p className="font-display text-2xl text-gold">S/ {Number(ganador.monto).toFixed(2)}</p>
        )}
        <p className="text-sm text-cream">{ganador.premio}</p>
        {!ganador.monto && ganador.descripcion && (
          <p className="text-xs text-muted">{ganador.descripcion}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        {ganador.tipo_sorteo && (
          <span className="border border-gold/20 bg-gold/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gold">
            {ganador.tipo_sorteo}
          </span>
        )}
        {ganador.fecha_sorteo && (
          <span className="text-xs text-muted">
            {new Date(ganador.fecha_sorteo).toLocaleDateString('es-PE', { dateStyle: 'medium' })}
          </span>
        )}
      </div>
    </div>
  )
}

function EmptyState({ filtrado, onLimpiar }) {
  const router = useRouter()
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}
      className="border border-gold/10 bg-surface px-6 py-20 text-center"
    >
      <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        className="mx-auto mb-6 flex size-20 items-center justify-center border border-gold/20 bg-gold/5">
        <svg className="size-10 text-gold/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8m-4-4v4m-5-8H5a2 2 0 01-2-2V7h18v4a2 2 0 01-2 2h-2m-8 0h8m-8 0a5 5 0 0010 0" />
        </svg>
      </motion.div>
      <p className="font-display text-3xl text-muted">
        {filtrado ? 'Sin ganadores en este sorteo' : 'Aún no hay ganadores publicados'}
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
        {filtrado ? 'Prueba seleccionando otro sorteo o limpia el filtro.'
          : 'Los resultados se publicarán después de cada sorteo en vivo.'}
      </p>
      <motion.button type="button" onClick={filtrado ? onLimpiar : () => router.push('/')}
        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
        className="mt-8 border border-gold/50 px-6 py-3 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/10">
        {filtrado ? 'Ver todos los ganadores' : 'Ver sorteos activos'}
      </motion.button>
    </motion.div>
  )
}
