import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import SorteosTable from '../_components/SorteosTable'

export const metadata = { title: 'Sorteos — Bingos Pao' }

export default async function SorteosPage() {
  const supabase = createAdminClient()

  // Fetch sorteos
  const { data: sorteos } = await supabase
    .from('sorteos')
    .select('id, nombre, tipo, fecha_sorteo, precio_participacion, estado')
    .order('created_at', { ascending: false })

  // Count participantes activos (pendiente + confirmado) por sorteo
  let withCounts = sorteos ?? []
  if (withCounts.length) {
    const ids = withCounts.map((s) => s.id)
    const { data: participantes } = await supabase
      .from('participantes')
      .select('sorteo_id')
      .in('sorteo_id', ids)
      .in('estado', ['pendiente', 'confirmado'])

    const countMap = {}
    ;(participantes ?? []).forEach((p) => {
      countMap[p.sorteo_id] = (countMap[p.sorteo_id] ?? 0) + 1
    })

    withCounts = withCounts.map((s) => ({
      ...s,
      participantes_count: countMap[s.id] ?? 0,
      fecha_sorteo_fmt: s.fecha_sorteo
        ? new Date(s.fecha_sorteo).toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : null,
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl tracking-wide text-gold">Sorteos</h1>
          <p className="mt-1 text-sm text-muted">
            {withCounts.length} sorteo{withCounts.length !== 1 ? 's' : ''} registrado{withCounts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/sorteos/create"
          className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-bg transition hover:bg-gold-light"
        >
          <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo Sorteo
        </Link>
      </div>

      <SorteosTable sorteos={withCounts} />
    </div>
  )
}
