import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import * as XLSX from 'xlsx'

export async function GET(request) {
  // Auth check
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return new Response('No autorizado', { status: 401 })

  const { searchParams } = new URL(request.url)
  const sorteoId = searchParams.get('sorteo_id') || null

  const supabase = createAdminClient()

  let query = supabase
    .from('participantes')
    .select('id, nombres, apellidos, whatsapp, dni, departamento, provincia, distrito, direccion, estado, numero_registro, nota_interna, created_at, sorteos(nombre, fecha_sorteo)')
    .order('created_at', { ascending: false })

  if (sorteoId) query = query.eq('sorteo_id', sorteoId)

  const { data, error } = await query
  if (error) return new Response('Error al obtener datos', { status: 500 })

  const ESTADO_LABEL = { pendiente: 'Pendiente', confirmado: 'Confirmado', rechazado: 'Rechazado' }

  const rows = (data ?? []).map((p, i) => ({
    'N°': i + 1,
    'N° Registro': p.numero_registro ?? '—',
    'Nombres': p.nombres,
    'Apellidos': p.apellidos,
    'DNI': p.dni ?? '—',
    'WhatsApp': p.whatsapp,
    'Departamento': p.departamento ?? '—',
    'Provincia': p.provincia ?? '—',
    'Distrito': p.distrito ?? '—',
    'Dirección': p.direccion ?? '—',
    'Estado': ESTADO_LABEL[p.estado] ?? p.estado,
    'Sorteo': p.sorteos?.nombre ?? '—',
    'Fecha del sorteo': p.sorteos?.fecha_sorteo
      ? new Date(p.sorteos.fecha_sorteo).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' })
      : '—',
    'Fecha de registro': new Date(p.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima', dateStyle: 'short', timeStyle: 'short' }),
    'Nota interna': p.nota_interna ?? '',
  }))

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)

  // Column widths
  ws['!cols'] = [
    { wch: 5 }, { wch: 14 }, { wch: 22 }, { wch: 22 }, { wch: 12 },
    { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 },
    { wch: 14 }, { wch: 30 }, { wch: 28 }, { wch: 20 }, { wch: 20 }, { wch: 35 },
  ]

  XLSX.utils.book_append_sheet(wb, ws, 'Participantes')

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  const filename = sorteoId
    ? `participantes_sorteo_${sorteoId}.xlsx`
    : `participantes_todos.xlsx`

  return new Response(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
