import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminLayoutClient from './_components/AdminLayoutClient'

export default async function DashboardLayout({ children }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: configRows }, { count: pendientesCount }] = await Promise.all([
    supabase
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['nombre_negocio', 'logo_path']),
    supabase
      .from('participantes')
      .select('*', { count: 'exact', head: true })
      .eq('estado', 'pendiente'),
  ])

  const config = Object.fromEntries(
    (configRows ?? []).map(({ clave, valor }) => [clave, valor])
  )

  const logoPath = config.logo_path
  if (logoPath) {
    const { data: { publicUrl } } = supabase.storage
      .from('configuracion')
      .getPublicUrl(logoPath)
    config.logo_url = publicUrl || null
  }

  return (
    <AdminLayoutClient
      config={config}
      pendientesCount={pendientesCount ?? 0}
      user={user}
    >
      {children}
    </AdminLayoutClient>
  )
}
