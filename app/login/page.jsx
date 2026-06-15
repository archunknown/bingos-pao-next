import { createClient } from '@/lib/supabase/server'
import LoginClient from './LoginClient'

export const metadata = { title: 'Acceso Admin — Bingos Pao' }

export default async function LoginPage() {
  const supabase = await createClient()

  const { data: configRows } = await supabase
    .from('configuracion')
    .select('clave, valor')
    .in('clave', ['nombre_negocio', 'logo_path'])

  const config = Object.fromEntries(
    (configRows ?? []).map(({ clave, valor }) => [clave, valor])
  )

  const nombre = config.nombre_negocio || 'Bingos Pao'

  let logoUrl = null
  if (config.logo_path) {
    const { data: { publicUrl } } = supabase.storage
      .from('configuracion')
      .getPublicUrl(config.logo_path)
    logoUrl = publicUrl || null
  }

  return <LoginClient logoUrl={logoUrl} nombre={nombre} />
}
