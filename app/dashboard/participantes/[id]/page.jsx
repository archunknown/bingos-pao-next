import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import ParticipanteShowClient from './ParticipanteShowClient'

export const metadata = { title: 'Participante — Bingos Pao' }

export default async function ParticipanteShowPage({ params }) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: participante } = await supabase
    .from('participantes')
    .select('id, nombres, apellidos, whatsapp, dni, departamento, provincia, distrito, direccion, numero_registro, estado, created_at, nota_interna, comprobante_path, sorteo_id, sorteos(id, nombre)')
    .eq('id', id)
    .single()

  if (!participante) notFound()

  let comprobanteUrl = null
  if (participante.comprobante_path) {
    const { data } = await supabase.storage
      .from('comprobantes')
      .createSignedUrl(participante.comprobante_path, 60 * 60) // válida 1 hora
    comprobanteUrl = data?.signedUrl ?? null
  }

  return <ParticipanteShowClient participante={participante} comprobanteUrl={comprobanteUrl} />
}
