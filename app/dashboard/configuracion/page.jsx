import { createAdminClient } from '@/lib/supabase/admin'
import ConfiguracionClient from './ConfiguracionClient'

export const metadata = { title: 'Configuración — Bingos Pao' }

export default async function ConfiguracionPage() {
  const supabase = createAdminClient()
  const { data: rows } = await supabase
    .from('configuracion')
    .select('clave, valor')

  const config = Object.fromEntries((rows ?? []).map(r => [r.clave, r.valor]))

  // Generate public storage URLs for existing images
  const imageKeys = ['logo', 'qr_yape', 'qr_plin']
  const imageUrls = {}
  for (const key of imageKeys) {
    const path = config[`${key}_path`]
    if (path) {
      const { data: { publicUrl } } = supabase.storage
        .from('configuracion')
        .getPublicUrl(path)
      imageUrls[`${key}_url`] = publicUrl || null
    } else {
      imageUrls[`${key}_url`] = null
    }
  }

  return <ConfiguracionClient config={config} imageUrls={imageUrls} />
}
