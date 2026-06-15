import { createClient } from '@/lib/supabase/server'
import PublicLayoutClient from './_components/PublicLayoutClient'

export default async function PublicLayout({ children }) {
  const supabase = await createClient()
  const { data: rows } = await supabase
    .from('configuracion')
    .select('clave, valor')
    .in('clave', ['nombre_negocio', 'logo_path', 'whatsapp_contacto', 'titular_pago'])

  const cfg = Object.fromEntries((rows ?? []).map(r => [r.clave, r.valor]))

  let logoUrl = null
  if (cfg.logo_path) {
    const { data: { publicUrl } } = supabase.storage.from('configuracion').getPublicUrl(cfg.logo_path)
    logoUrl = publicUrl || null
  }

  return (
    <PublicLayoutClient
      nombre={cfg.nombre_negocio || 'Bingos Pao'}
      logoUrl={logoUrl}
      titular={cfg.titular_pago || null}
      whatsapp={cfg.whatsapp_contacto || null}
    >
      {children}
    </PublicLayoutClient>
  )
}
