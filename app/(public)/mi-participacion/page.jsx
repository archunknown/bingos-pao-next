import { createClient } from '@/lib/supabase/server'
import MiParticipacionClient from './_components/MiParticipacionClient'

export const metadata = { title: 'Mi Participación — Bingos Pao' }

export default async function MiParticipacionPage({ searchParams }) {
  const { whatsapp: whatsappRaw } = await searchParams
  const whatsapp = whatsappRaw ? String(whatsappRaw).replace(/\D/g, '').slice(0, 15) : null

  let resultados = []

  if (whatsapp && whatsapp.length >= 7) {
    const supabase = await createClient()
    const { data } = await supabase
      .from('participantes')
      .select('id, nombres, apellidos, whatsapp, estado, numero_registro, nota_interna, created_at, sorteo:sorteo_id(nombre, fecha_sorteo, estado)')
      .eq('whatsapp', whatsapp)
      .order('created_at', { ascending: false })
      .limit(20)

    resultados = (data ?? []).map(p => ({
      id:              p.id,
      nombres:         p.nombres,
      apellidos:       p.apellidos,
      estado:          p.estado,
      numero_registro: p.numero_registro,
      nota_interna:    p.nota_interna,
      sorteo_nombre:   p.sorteo?.nombre ?? null,
      sorteo_fecha:    p.sorteo?.fecha_sorteo
        ? new Date(p.sorteo.fecha_sorteo).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'medium', timeStyle: 'short' })
        : null,
      sorteo_estado:   p.sorteo?.estado ?? null,
    }))
  }

  return (
    <MiParticipacionClient
      resultados={resultados}
      busqueda={whatsapp}
    />
  )
}
