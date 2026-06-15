import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET() {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })

  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('sorteos')
    .select('id, nombre, tipo, estado, precio_participacion, fecha_sorteo, participantes(estado)')
    .order('fecha_sorteo', { ascending: false })

  if (error) return new Response('Error al obtener datos', { status: 500 })

  const TIPO_LABEL   = { sorteo: 'Sorteo', pozito: 'Pozito', especial: 'Especial', aniversario: 'Aniversario' }
  const ESTADO_LABEL = { borrador: 'Borrador', activo: 'Activo', cerrado: 'Cerrado' }

  const rows = (data ?? []).map((s, i) => {
    const confirmados = (s.participantes ?? []).filter(p => p.estado === 'confirmado').length
    const pendientes  = (s.participantes ?? []).filter(p => p.estado === 'pendiente').length
    const total       = (s.participantes ?? []).length
    const recaudado   = confirmados * Number(s.precio_participacion)

    return {
      'N°': i + 1,
      'Nombre': s.nombre,
      'Tipo': TIPO_LABEL[s.tipo] ?? s.tipo,
      'Estado': ESTADO_LABEL[s.estado] ?? s.estado,
      'Precio (S/)': Number(s.precio_participacion).toFixed(2),
      'Fecha del sorteo': s.fecha_sorteo
        ? new Date(s.fecha_sorteo).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' })
        : '—',
      'Confirmados': confirmados,
      'Pendientes': pendientes,
      'Total participantes': total,
      'Total recaudado (S/)': recaudado.toFixed(2),
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  ws['!cols'] = [
    { wch: 5 }, { wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 14 },
    { wch: 20 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 20 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Sorteos')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="sorteos.xlsx"',
    },
  })
}
