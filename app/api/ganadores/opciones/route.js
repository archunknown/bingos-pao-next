import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const sorteoId = searchParams.get('sorteo_id')

  if (!sorteoId) {
    return Response.json({ participantes: [], premios: [] })
  }

  const supabase = createAdminClient()

  const [{ data: participantes }, { data: premios }] = await Promise.all([
    supabase
      .from('participantes')
      .select('id, nombres, apellidos, numero_registro')
      .eq('sorteo_id', sorteoId)
      .eq('estado', 'confirmado')
      .order('numero_registro'),
    supabase
      .from('premios')
      .select('id, nombre, monto, descripcion_premio')
      .eq('sorteo_id', sorteoId)
      .order('orden'),
  ])

  return Response.json({
    participantes: participantes ?? [],
    premios: premios ?? [],
  })
}
