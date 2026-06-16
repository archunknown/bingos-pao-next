'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { confirmarParticipante, rechazarParticipante } from '@/app/actions/participantes'

const ESTADO_BADGE = {
  pendiente:  'bg-gold/10 text-gold border border-gold/30',
  confirmado: 'bg-success/10 text-success border border-success/30',
  rechazado:  'bg-danger/10 text-danger border border-danger/30',
}

export default function ParticipanteShowClient({ participante, comprobanteUrl }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rechazarOpen, setRechazarOpen] = useState(false)
  const [confirmarOpen, setConfirmarOpen] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') { setLightboxOpen(false); setConfirmarOpen(false) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function handleConfirmar() {
    startTransition(async () => {
      await confirmarParticipante(participante.id)
    })
  }

  const esPendiente = participante.estado === 'pendiente'

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/participantes"
          className="flex items-center gap-1 text-muted transition hover:text-cream"
          aria-label="Volver"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div>
          <h1 className="font-display text-4xl tracking-wide text-cream">
            {participante.nombres} {participante.apellidos}
          </h1>
          <p className="text-sm text-muted">{participante.sorteos?.nombre}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Datos */}
        <div className="space-y-4 border border-gold/20 bg-surface p-5">
          <h2 className="border-l-4 border-gold pl-3 font-display text-2xl text-gold">DATOS</h2>

          <dl className="divide-y divide-gold/10 text-sm">
            <DataRow label="N° registro" value={participante.numero_registro ?? '—'} mono />
            <DataRow label="Estado">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${ESTADO_BADGE[participante.estado] ?? ''}`}>
                <span className={`size-1.5 rounded-full ${
                  participante.estado === 'confirmado' ? 'bg-success' :
                  participante.estado === 'rechazado'  ? 'bg-danger'  : 'bg-gold'
                }`} />
                {participante.estado}
              </span>
            </DataRow>
            <DataRow label="Nombres" value={`${participante.nombres} ${participante.apellidos}`} />
            {participante.dni && (
              <DataRow label="DNI" value={participante.dni} mono />
            )}
            <DataRow label="WhatsApp" value={participante.whatsapp} />
            {(participante.departamento || participante.provincia || participante.distrito) && (
              <DataRow label="Ubicación" value={[participante.distrito, participante.provincia, participante.departamento].filter(Boolean).join(', ')} />
            )}
            {participante.direccion && (
              <DataRow label="Dirección" value={participante.direccion} />
            )}
            <DataRow label="Sorteo" value={participante.sorteos?.nombre ?? '—'} />
            <DataRow
              label="Registrado"
              value={new Date(participante.created_at).toLocaleString('es-PE', {
                dateStyle: 'long', timeStyle: 'short',
              })}
            />
            {participante.nota_interna && (
              <DataRow label="Nota interna" value={participante.nota_interna} />
            )}
          </dl>

          {/* Acciones CONFIRMAR / RECHAZAR */}
          {esPendiente && !rechazarOpen && (
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setConfirmarOpen(true)}
                className="flex flex-1 flex-col items-center gap-1.5 bg-success py-3 text-white transition hover:opacity-90 disabled:opacity-60"
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider">Confirmar</span>
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => setRechazarOpen(true)}
                className="flex flex-1 flex-col items-center gap-1.5 border border-danger/30 bg-danger/10 py-3 text-danger transition hover:bg-danger hover:text-white disabled:opacity-60"
              >
                <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-bold uppercase tracking-wider">Rechazar</span>
              </button>
            </div>
          )}

          {rechazarOpen && (
            <RechazarForm participanteId={participante.id} onCancel={() => setRechazarOpen(false)} />
          )}
        </div>

        {/* Comprobante */}
        <div className="space-y-3 border border-gold/20 bg-surface p-5">
          <h2 className="border-l-4 border-gold pl-3 font-display text-2xl text-gold">COMPROBANTE</h2>

          {comprobanteUrl ? (
            <div>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="group relative block w-full overflow-hidden border border-gold/20 transition hover:opacity-90"
              >
                <img
                  src={comprobanteUrl}
                  alt="Comprobante de pago"
                  className="w-full object-contain"
                  style={{ maxHeight: '420px' }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
                  <span className="scale-0 rounded-full bg-black/60 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-transform group-hover:scale-100">
                    Ver en pantalla completa
                  </span>
                </div>
              </button>
              <p className="mt-2 text-center text-xs text-muted">
                Clic para ampliar ·{' '}
                <kbd className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-[10px]">Esc</kbd> para cerrar
              </p>
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 border-2 border-dashed border-gold/20 text-muted">
              <svg className="size-8 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Sin comprobante</span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-surface text-muted transition hover:text-cream"
          >
            <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={comprobanteUrl}
            alt="Comprobante de pago"
            className="max-h-full max-w-full object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Modal confirmar */}
      {confirmarOpen && (
        <ConfirmarModal
          participante={participante}
          isPending={isPending}
          onConfirm={() => { setConfirmarOpen(false); handleConfirmar() }}
          onCancel={() => setConfirmarOpen(false)}
        />
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ConfirmarModal({ participante, isPending, onConfirm, onCancel }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-bg/80 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm border border-gold/20 bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-success/10 text-success">
            <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <h2 className="font-display text-2xl text-cream">CONFIRMAR PAGO</h2>
        </div>
        <p className="mb-1 text-sm text-muted">Estás por confirmar la participación de:</p>
        <p className="mb-1 font-semibold text-cream">{participante.nombres} {participante.apellidos}</p>
        <p className="mb-5 text-sm text-muted">
          Sorteo: <span className="text-content">{participante.sorteos?.nombre}</span>
        </p>
        <p className="mb-6 text-xs text-muted">
          Se le asignará un número de registro y quedará habilitado para participar.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-gold/30 py-2.5 text-sm font-medium text-muted transition hover:border-gold hover:text-cream"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className="flex-1 bg-success py-2.5 text-sm font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {isPending ? 'Confirmando…' : 'Sí, confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RechazarForm({ participanteId, onCancel }) {
  const [isPending, startTransition] = useTransition()
  const [nota, setNota] = useState('')
  const [error, setError] = useState(null)

  function handleSubmit(e) {
    e.preventDefault()
    startTransition(async () => {
      const result = await rechazarParticipante(participanteId, nota)
      if (result?.errors) { setError(result.errors.nota_interna); return }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border border-danger/30 bg-danger/10 p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-danger">Motivo del rechazo</p>
      <textarea
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        rows={3}
        placeholder="Describe el motivo del rechazo…"
        className={[
          'w-full resize-none border bg-surface2 px-3 py-2 text-sm text-cream placeholder-muted outline-none transition-colors',
          error ? 'border-danger' : 'border-gold/20 focus:border-gold',
        ].join(' ')}
        autoFocus
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="border border-gold/30 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-gold hover:text-cream"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="bg-danger px-4 py-1.5 text-xs font-bold uppercase text-white transition hover:bg-danger-dark disabled:opacity-50"
        >
          {isPending ? 'Guardando…' : 'Confirmar rechazo'}
        </button>
      </div>
    </form>
  )
}

function DataRow({ label, value, mono, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-xs uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`text-right text-sm text-cream ${mono ? 'font-mono' : ''}`}>
        {children ?? value}
      </dd>
    </div>
  )
}
