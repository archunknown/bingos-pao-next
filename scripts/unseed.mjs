/**
 * Elimina todos los datos de prueba de las tablas y el bucket de comprobantes.
 *
 * Uso:
 *   npm run unseed
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// 1. Ganadores
const { error: e1 } = await supabase.from('ganadores').delete().neq('id', 0)
if (e1) console.error('Error vaciando ganadores:', e1.message)
else console.log('✓  ganadores vaciada')

// 2. Participantes
const { error: e2 } = await supabase.from('participantes').delete().neq('id', 0)
if (e2) console.error('Error vaciando participantes:', e2.message)
else console.log('✓  participantes vaciada')

// 3. Premios
const { error: e3 } = await supabase.from('premios').delete().neq('id', 0)
if (e3) console.error('Error vaciando premios:', e3.message)
else console.log('✓  premios vaciada')

// 4. Sorteos
const { error: e4 } = await supabase.from('sorteos').delete().neq('id', 0)
if (e4) console.error('Error vaciando sorteos:', e4.message)
else console.log('✓  sorteos vaciada')

// 5. Bucket comprobantes
const { data: folders } = await supabase.storage.from('comprobantes').list('', { limit: 1000 })
if (folders?.length) {
  for (const folder of folders) {
    const { data: files } = await supabase.storage
      .from('comprobantes')
      .list(folder.name, { limit: 1000 })
    if (files?.length) {
      const paths = files.map(f => `${folder.name}/${f.name}`)
      await supabase.storage.from('comprobantes').remove(paths)
    }
  }
  console.log('✓  bucket comprobantes vaciado')
} else {
  console.log('–  bucket comprobantes ya estaba vacío')
}

console.log('\nUnseed completado.')
