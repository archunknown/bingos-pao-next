import { createAdminClient } from '@/lib/supabase/admin'
import TransmisionClient from './TransmisionClient'

export const metadata = { title: 'Transmisión — Bingos Pao' }

export default async function TransmisionPage() {
  const supabase = createAdminClient()
  const { data: rows } = await supabase
    .from('configuracion')
    .select('clave, valor')

  const config = Object.fromEntries((rows ?? []).map(r => [r.clave, r.valor]))

  return <TransmisionClient config={config} />
}
