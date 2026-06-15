import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'

export const metadata = { title: 'Dashboard — Bingos Pao' }

const ESTADO_BADGE = {
  pendiente:  { label: 'Pendiente',  cls: 'bg-gold/15 text-gold border border-gold/30' },
  confirmado: { label: 'Confirmado', cls: 'bg-success/15 text-success border border-success/30' },
  rechazado:  { label: 'Rechazado', cls: 'bg-danger/15 text-danger border border-danger/30' },
}

export default async function DashboardPage() {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: sorteos_activos },
    { count: participantes_hoy },
    { count: comprobantes_pendientes },
    { data: activeSorteos },
    { data: actividad_reciente },
  ] = await Promise.all([
    supabase
      .from('sorteos')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'activo'),

    supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .in('estado', ['pendiente', 'confirmado']),

    supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente'),

    supabase
      .from('sorteos')
      .select('id, precio_participacion')
      .eq('estado', 'activo'),

    supabase
      .from('participantes')
      .select('id, sorteo_id, nombres, apellidos, estado, created_at, sorteos(nombre)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  // Calcular pozo acumulado desde sorteos activos
  let pozo_acumulado = 0
  if (activeSorteos?.length) {
    const ids = activeSorteos.map((s) => s.id)
    const { data: confirmed } = await supabase
      .from('participantes')
      .select('sorteo_id')
      .in('sorteo_id', ids)
      .eq('estado', 'confirmado')

    const priceMap = Object.fromEntries(
      activeSorteos.map((s) => [s.id, parseFloat(s.precio_participacion)])
    )
    pozo_acumulado = (confirmed ?? []).reduce(
      (total, p) => total + (priceMap[p.sorteo_id] ?? 0),
      0
    )
  }

  const stats = [
    {
      label: 'Sorteos Activos',
      value: sorteos_activos ?? 0,
      icon: <IconTicket />,
      accent: 'gold',
      glow: false,
      href: '/dashboard/sorteos',
    },
    {
      label: 'Participantes Hoy',
      value: participantes_hoy ?? 0,
      icon: <IconUsers />,
      accent: 'gold',
      glow: false,
      href: '/dashboard/participantes',
    },
    {
      label: 'Comprobantes Pendientes',
      value: comprobantes_pendientes ?? 0,
      icon: <IconClock />,
      accent: 'danger',
      glow: (comprobantes_pendientes ?? 0) > 0,
      href: '/dashboard/participantes',
    },
    {
      label: 'Pozo Acumulado',
      value: `S/ ${pozo_acumulado.toFixed(2)}`,
      icon: <IconCoin />,
      accent: 'gold',
      glow: pozo_acumulado > 0,
      href: null,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl tracking-wide text-gold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Resumen en tiempo real de tu negocio</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="rounded-xl border border-gold/15 bg-surface">
        <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
          <h2 className="text-sm font-semibold tracking-wide text-content">
            Actividad Reciente
          </h2>
          <Link
            href="/dashboard/participantes"
            className="text-xs text-muted transition hover:text-gold"
          >
            Ver todos →
          </Link>
        </div>

        {!actividad_reciente?.length ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No hay participantes registrados aún
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold/10 text-left">
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Participante</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Sorteo</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Estado</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5">
                {actividad_reciente.map((p) => {
                  const badge = ESTADO_BADGE[p.estado] ?? ESTADO_BADGE.pendiente
                  return (
                    <tr key={p.id} className="transition hover:bg-surface2/50">
                      <td className="px-5 py-3 font-medium text-content">
                        {p.nombres} {p.apellidos}
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {p.sorteos?.nombre ?? '—'}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted">
                        {new Date(p.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, accent, glow, href }) {
  const borderCls = accent === 'danger' ? 'border-danger/30' : 'border-gold/20'
  const iconCls   = accent === 'danger' ? 'text-danger' : 'text-gold'
  const valueCls  = accent === 'danger' ? 'text-danger' : 'text-gold'
  const glowCls   = glow
    ? accent === 'danger'
      ? 'shadow-lg shadow-danger/20'
      : 'shadow-lg shadow-gold/20'
    : ''

  const inner = (
    <div className={`rounded-xl border bg-surface p-5 transition-colors ${borderCls} ${glowCls} ${href ? 'hover:bg-surface2' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className={`mt-2 text-3xl font-bold tracking-tight ${valueCls}`}>{value}</p>
        </div>
        <div className={`rounded-lg bg-surface2 p-2.5 ${iconCls}`}>{icon}</div>
      </div>
    </div>
  )

  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}

function IconTicket() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
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

function IconClock() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function IconCoin() {
  return (
    <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}
