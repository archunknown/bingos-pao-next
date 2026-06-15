'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion } from 'framer-motion'
import { toggleEstado, deleteSorteo } from '@/app/actions/sorteos'

const TIPO_LABEL = {
  sorteo:      'Sorteo',
  pozito:      'Pozito',
  especial:    'Especial',
  aniversario: 'Aniversario',
}

const BORDER_ESTADO = {
  activo:   'border-l-success',
  borrador: 'border-l-muted/20',
  cerrado:  'border-l-danger/30',
}

const ESTADO_BADGE = {
  activo:   'bg-success/15 text-success border border-success/30',
  borrador: 'bg-muted/10 text-muted border border-muted/20',
  cerrado:  'bg-danger/10 text-danger/70 border border-danger/20',
}

const TOGGLE_LABEL = { borrador: 'Activar', activo: 'Cerrar' }
const TOGGLE_CLS   = {
  borrador: 'border-success/40 text-success hover:bg-success/10',
  activo:   'border-danger/40 text-danger hover:bg-danger/10',
}

export default function SorteosTable({ sorteos }) {
  const [isPending, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [closeTarget, setCloseTarget]   = useState(null)
  const [actionId, setActionId] = useState(null)

  function handleToggle(id, estado, nombre) {
    if (estado === 'activo') {
      setCloseTarget({ id, nombre })
      return
    }
    setActionId(id)
    startTransition(async () => {
      await toggleEstado(id)
      setActionId(null)
    })
  }

  function confirmClose() {
    if (!closeTarget) return
    const id = closeTarget.id
    setCloseTarget(null)
    setActionId(id)
    startTransition(async () => {
      await toggleEstado(id)
      setActionId(null)
    })
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
    startTransition(async () => {
      await deleteSorteo(id)
    })
  }

  if (!sorteos.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gold/10 bg-surface py-16 text-center">
        <svg className="size-12 text-muted/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <p className="text-sm text-muted">No hay sorteos registrados</p>
        <Link
          href="/dashboard/sorteos/create"
          className="mt-1 rounded-lg bg-gold px-4 py-2 text-xs font-bold text-bg transition hover:bg-gold-light"
        >
          Crear primer sorteo
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {sorteos.map((s) => {
          const canDelete = s.estado === 'borrador' || (s.participantes_count ?? 0) === 0
          const canToggle = s.estado !== 'cerrado'
          const loading = isPending && actionId === s.id

          return (
            <div
              key={s.id}
              className={`rounded-xl border-l-4 border-y border-r border-gold/10 bg-surface transition-opacity ${BORDER_ESTADO[s.estado] ?? BORDER_ESTADO.borrador} ${loading ? 'opacity-60' : ''}`}
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-content truncate">{s.nombre}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${ESTADO_BADGE[s.estado] ?? ESTADO_BADGE.borrador} ${s.estado === 'activo' ? 'animate-pulse' : ''}`}>
                      {s.estado.charAt(0).toUpperCase() + s.estado.slice(1)}
                    </span>
                    <span className="rounded-md bg-surface2 px-2 py-0.5 text-[11px] text-muted">
                      {TIPO_LABEL[s.tipo] ?? s.tipo}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                    <span>📅 {s.fecha_sorteo_fmt ?? '—'}</span>
                    <span>💰 S/ {parseFloat(s.precio_participacion).toFixed(2)}</span>
                    <span>👥 {s.participantes_count ?? 0} participantes</span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex shrink-0 items-center gap-2">
                  {canToggle && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggle(s.id, s.estado, s.nombre)}
                      className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition ${TOGGLE_CLS[s.estado] ?? ''} disabled:opacity-50`}
                    >
                      {loading ? '...' : TOGGLE_LABEL[s.estado]}
                    </button>
                  )}
                  <Link
                    href={`/dashboard/sorteos/${s.id}/premios`}
                    className="rounded-md border border-gold/20 px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-gold/50 hover:text-cream"
                  >
                    Premios
                  </Link>
                  <Link
                    href={`/dashboard/sorteos/${s.id}/edit`}
                    className="rounded-md border border-gold/20 px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-gold/50 hover:text-cream"
                  >
                    Editar
                  </Link>
                  {canDelete && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setDeleteTarget({ id: s.id, nombre: s.nombre })}
                      className="rounded-md border border-danger/20 px-3 py-1.5 text-xs font-semibold text-danger/70 transition hover:bg-danger/10 hover:border-danger/50 disabled:opacity-50"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de confirmación de cierre */}
      <AnimatePresence>
        {closeTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setCloseTarget(null)} />
            <motion.div
              className="relative w-full max-w-md rounded-2xl border border-gold/20 bg-surface shadow-2xl overflow-hidden"
              initial={{ scale: 0.92, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {/* Franja superior */}
              <div className="flex items-center gap-3 border-b border-gold/10 bg-surface2 px-6 py-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Cerrar sorteo</p>
                  <p className="truncate text-sm font-semibold text-cream">{closeTarget.nombre}</p>
                </div>
              </div>

              {/* Cuerpo */}
              <div className="space-y-4 px-6 py-5">
                <p className="text-sm leading-relaxed text-muted">
                  Estás a punto de marcar este sorteo como finalizado. Antes de continuar, ten en cuenta lo siguiente:
                </p>

                {/* Lo que se elimina */}
                <div className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3.5">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-danger/80">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Se va a limpiar
                  </p>
                  <p className="text-sm text-danger/70">
                    Las <strong className="text-danger/90">fotos de los comprobantes de pago</strong> se borrarán del servidor para liberar espacio de almacenamiento.
                  </p>
                </div>

                {/* Lo que se conserva */}
                <div className="rounded-xl border border-success/20 bg-success/5 px-4 py-3.5">
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success/80">
                    <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Se conserva todo lo demás
                  </p>
                  <ul className="space-y-1 text-sm text-success/70">
                    <li>Lista completa de participantes y sus datos</li>
                    <li>Ganadores registrados</li>
                    <li>Premios del sorteo</li>
                  </ul>
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-end gap-3 border-t border-gold/10 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setCloseTarget(null)}
                  className="rounded-lg border border-gold/20 px-4 py-2 text-sm text-muted transition hover:border-gold/40 hover:text-cream"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmClose}
                  disabled={isPending}
                  className="rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-bg transition hover:bg-amber-400 disabled:opacity-50"
                >
                  Sí, cerrar sorteo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de confirmación de eliminación */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
            <motion.div
              className="relative w-full max-w-sm rounded-2xl border border-danger/30 bg-surface p-6 shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="text-base font-semibold text-content">¿Eliminar sorteo?</h3>
              <p className="mt-2 text-sm text-muted">
                Esta acción no se puede deshacer. Se eliminará permanentemente{' '}
                <strong className="text-content">{deleteTarget.nombre}</strong>.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg border border-gold/20 px-4 py-2 text-sm text-muted transition hover:text-cream"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="rounded-lg bg-danger px-4 py-2 text-sm font-semibold text-white transition hover:bg-danger-dark"
                >
                  Sí, eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
