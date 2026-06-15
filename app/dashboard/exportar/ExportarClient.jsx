'use client'

import { useState } from 'react'

const ESTADO_BADGE = {
  activo:   'bg-success/10 text-success border-success/30',
  borrador: 'bg-gold/10 text-gold border-gold/30',
  cerrado:  'bg-muted/10 text-muted border-muted/30',
}

export default function ExportarClient({ sorteos }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-4xl tracking-wide text-cream">EXPORTAR DATOS</h1>
      <p className="text-sm text-muted">
        Descarga los datos del sistema en formato Excel (.xlsx) listo para abrir en Excel, Google Sheets u otras hojas de cálculo.
      </p>

      <div className="space-y-4">
        <ExportCard
          icon={<IconUsers />}
          title="Participantes"
          description="Lista de participantes con su estado, número de registro, WhatsApp y sorteo asociado."
          columns={['N°', 'N° Registro', 'Nombres', 'Apellidos', 'WhatsApp', 'Estado', 'Sorteo', 'Fecha del sorteo', 'Fecha de registro', 'Nota interna']}
          color="gold"
        >
          <ParticipantesExport sorteos={sorteos} />
        </ExportCard>

        <ExportCard
          icon={<IconTrophy />}
          title="Ganadores"
          description="Historial completo de ganadores con premio, sorteo y estado de publicación."
          columns={['N°', 'Ganador', 'WhatsApp', 'Premio', 'Monto', 'Sorteo', 'Tipo', 'Fecha del sorteo', 'Publicado', 'Fecha de registro']}
          color="gold"
        >
          <DownloadButton href="/api/export/ganadores" label="Descargar ganadores" />
        </ExportCard>

        <ExportCard
          icon={<IconTicket />}
          title="Sorteos"
          description="Resumen de todos los sorteos con totales de participantes y recaudación estimada."
          columns={['N°', 'Nombre', 'Tipo', 'Estado', 'Precio', 'Fecha', 'Confirmados', 'Pendientes', 'Total participantes', 'Total recaudado']}
          color="gold"
        >
          <DownloadButton href="/api/export/sorteos" label="Descargar sorteos" />
        </ExportCard>
      </div>
    </div>
  )
}

/* ── Participantes con selector de sorteo ── */
function ParticipantesExport({ sorteos }) {
  const [sorteoId, setSorteoId] = useState('')

  const href = sorteoId
    ? `/api/export/participantes?sorteo_id=${sorteoId}`
    : '/api/export/participantes'

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-widest text-muted">
          Filtrar por sorteo (opcional)
        </label>
        <select
          value={sorteoId}
          onChange={e => setSorteoId(e.target.value)}
          className="w-full border border-gold/20 bg-surface2 px-3 py-2.5 text-sm text-cream outline-none transition focus:border-gold"
        >
          <option value="">Todos los sorteos</option>
          {sorteos.map(s => (
            <option key={s.id} value={s.id}>
              {s.nombre}
              {s.estado !== 'activo' ? ` (${s.estado})` : ''}
            </option>
          ))}
        </select>
      </div>
      <DownloadButton href={href} label="Descargar participantes" />
    </div>
  )
}

/* ── Botón de descarga ── */
function DownloadButton({ href, label }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch(href)
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = href.split('/').pop().split('?')[0] + '.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Error al generar el archivo. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="flex shrink-0 items-center gap-2 bg-gold px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-bg transition hover:bg-gold-light disabled:opacity-60"
    >
      {loading ? <IconSpinner /> : <IconDownload />}
      {loading ? 'Generando…' : label}
    </button>
  )
}

/* ── Card de exportación ── */
function ExportCard({ icon, title, description, columns, children }) {
  return (
    <div className="border border-gold/20 bg-surface">
      <div className="flex items-center gap-4 border-b border-gold/10 px-5 py-4">
        <div className="flex size-10 shrink-0 items-center justify-center bg-gold/10 text-gold">
          {icon}
        </div>
        <div>
          <h2 className="font-display text-2xl text-gold">{title}</h2>
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Preview de columnas */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted">Columnas incluidas</p>
          <div className="flex flex-wrap gap-1.5">
            {columns.map(col => (
              <span key={col} className="rounded border border-gold/20 bg-surface2 px-2 py-0.5 text-[11px] text-muted">
                {col}
              </span>
            ))}
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

/* ── Icons ── */
function IconDownload() {
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  )
}
function IconSpinner() {
  return (
    <svg className="size-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}
function IconUsers() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}
function IconTrophy() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  )
}
function IconTicket() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
    </svg>
  )
}
