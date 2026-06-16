import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import SorteoPublicoClient from './_components/SorteoPublicoClient'

export const revalidate = 60

export async function generateMetadata({ params }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: sorteo } = await supabase.from('sorteos').select('nombre').eq('id', id).single()
  return { title: sorteo ? `${sorteo.nombre} — Bingos Pao` : 'Sorteo — Bingos Pao' }
}

export default async function SorteoPublicoPage({ params }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: sorteo }, { data: configRows }, { count: inscritos }] = await Promise.all([
    supabase
      .from('sorteos')
      .select('id, nombre, tipo, precio_participacion, fecha_sorteo, descripcion, limite_participantes, premios(id, nombre, monto, descripcion_premio, cantidad, orden, visible)')
      .eq('id', id)
      .eq('estado', 'activo')
      .single(),
    supabase.from('configuracion').select('clave, valor'),
    supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true })
      .eq('sorteo_id', id)
      .in('estado', ['pendiente', 'confirmado']),
  ])

  if (!sorteo) notFound()

  const config = Object.fromEntries((configRows ?? []).map(r => [r.clave, r.valor]))

  for (const key of ['qr_yape']) {
    const path = config[`${key}_path`]
    if (path) {
      const { data: { publicUrl } } = supabase.storage.from('configuracion').getPublicUrl(path)
      config[`${key}_url`] = publicUrl || null
    }
  }

  const inscritosTotal = inscritos ?? 0
  const cupo_lleno = sorteo.limite_participantes != null && inscritosTotal >= sorteo.limite_participantes

  const sorteoData = {
    ...sorteo,
    inscritos: inscritosTotal,
    cupo_lleno,
    premios: (sorteo.premios ?? []).filter(p => p.visible !== false).sort((a, b) => a.orden - b.orden),
    fecha_sorteo_fmt: new Date(sorteo.fecha_sorteo).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'full', timeStyle: 'short' }),
  }

  return <SorteoPublicoClient sorteo={sorteoData} config={config} />
}
