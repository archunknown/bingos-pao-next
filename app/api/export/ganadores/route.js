import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ganadores')
    .select('id, publicado, created_at, participante:participantes!ganadores_participante_id_fkey(nombres, apellidos, whatsapp), premio:premios!ganadores_premio_id_fkey(nombre, monto, descripcion_premio), sorteo:sorteos!ganadores_sorteo_id_fkey(nombre, tipo, fecha_sorteo)')
    .order('created_at', { ascending: false })

  if (error) return new Response('Error al obtener datos', { status: 500 })

  const TIPO_LABEL = { sorteo: 'Sorteo', pozito: 'Pozito', especial: 'Especial', aniversario: 'Aniversario' }

  const rows = (data ?? []).map((g, i) => ({
    'N°': i + 1,
    'Ganador': `${g.participante?.nombres ?? ''} ${g.participante?.apellidos ?? ''}`.trim(),
    'WhatsApp': g.participante?.whatsapp ?? '—',
    'Premio': g.premio?.nombre ?? '—',
    'Monto (S/)': g.premio?.monto != null ? Number(g.premio.monto).toFixed(2) : (g.premio?.descripcion_premio ?? '—'),
    'Sorteo': g.sorteo?.nombre ?? '—',
    'Tipo': TIPO_LABEL[g.sorteo?.tipo] ?? g.sorteo?.tipo ?? '—',
    'Fecha del sorteo': g.sorteo?.fecha_sorteo
      ? new Date(g.sorteo.fecha_sorteo).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' })
      : '—',
    'Publicado': g.publicado ? 'Sí' : 'No',
    'Fecha de registro': new Date(g.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' }),
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  ws['!cols'] = [
    { wch: 5 }, { wch: 28 }, { wch: 14 }, { wch: 28 }, { wch: 18 },
    { wch: 28 }, { wch: 14 }, { wch: 20 }, { wch: 12 }, { wch: 20 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Ganadores')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="ganadores.xlsx"',
    },
  })
}
