/**
 * Seed de datos de prueba — equivalente a SorteoSeeder + ParticipanteSeeder + GanadorSeeder de Laravel.
 * Idempotente: omite cada sorteo que ya exista por nombre.
 *
 * Uso:
 *   npm run seed
 */

import { createClient } from '@supabase/supabase-js'

// ── Env ──────────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Datos ────────────────────────────────────────────────────────────────────

const NOMBRES   = ['Ana','Luis','Carmen','Jorge','María','Carlos','Rosa','Juan','Elena','Pedro','Sofía','Miguel','Lucía','Roberto','Patricia','Diego','Claudia','Fernando','Gabriela','Óscar','Verónica','Andrés','Natalia','Héctor','Valeria','Raúl','Pamela','Javier','Mónica','César','Silvia','Marcos','Liliana','Álvaro','Rocío','Eduardo','Vanessa','Hugo','Beatriz','Rodrigo']
const APELLIDOS = ['García','Rodríguez','López','Martínez','González','Pérez','Sánchez','Torres','Flores','Ramírez','Cruz','Reyes','Morales','Ortiz','Herrera','Medina','Vargas','Castillo','Ramos','Quispe','Huanca','Mamani','Ccopa','Condori','Apaza','Cano','Espinoza','Paredes','Chávez','Rojas']

const hoy = new Date()
const dias = (n) => { const d = new Date(hoy); d.setDate(d.getDate() + n); return d.toISOString() }

const SORTEOS_SEED = [
  {
    sorteo: {
      nombre: 'Gran Sorteo Navideño 2025',
      tipo: 'sorteo',
      fecha_sorteo: dias(-20),
      precio_participacion: 10.00,
      descripcion: 'El gran sorteo de fin de año con premios increíbles para toda la familia.',
      estado: 'cerrado',
    },
    premios: [
      { nombre: 'Premio Mayor',    cantidad: 1, monto: 500.00, descripcion_premio: null, orden: 1 },
      { nombre: 'Segundo Premio',  cantidad: 2, monto: 200.00, descripcion_premio: null, orden: 2 },
      { nombre: 'Premio Consuelo', cantidad: 5, monto: null,   descripcion_premio: 'Canasta navideña', orden: 3 },
    ],
    participantes: { total: 30, confirmados: 22, rechazados: 4 },
  },
  {
    sorteo: {
      nombre: 'Sorteo Especial Año Nuevo',
      tipo: 'especial',
      fecha_sorteo: dias(-5),
      precio_participacion: 15.00,
      descripcion: 'Sorteo especial para recibir el nuevo año con grandes premios en efectivo.',
      estado: 'cerrado',
    },
    premios: [
      { nombre: 'Premio Mayor',   cantidad: 1, monto: 300.00, descripcion_premio: null, orden: 1 },
      { nombre: 'Premio Segundo', cantidad: 3, monto: 100.00, descripcion_premio: null, orden: 2 },
    ],
    participantes: { total: 30, confirmados: 22, rechazados: 4 },
  },
  {
    sorteo: {
      nombre: 'Pozito Semanal #12',
      tipo: 'pozito',
      fecha_sorteo: dias(6),
      precio_participacion: 5.00,
      descripcion: 'Nuestro pozito semanal, ¡participa y gana cada semana!',
      estado: 'activo',
    },
    premios: [
      { nombre: 'Premio Mayor',    cantidad: 1, monto: 400.00, descripcion_premio: null, orden: 1 },
      { nombre: 'Segundo Premio',  cantidad: 2, monto: 150.00, descripcion_premio: null, orden: 2 },
      { nombre: 'Premio Consuelo', cantidad: 5, monto: null,   descripcion_premio: 'Billeteras', orden: 3 },
    ],
    participantes: { total: 20, confirmados: 12, rechazados: 2 },
  },
  {
    sorteo: {
      nombre: 'Sorteo Aniversario Edición Oro',
      tipo: 'aniversario',
      fecha_sorteo: dias(30),
      precio_participacion: 20.00,
      descripcion: 'Celebramos nuestro aniversario con el sorteo más grande del año.',
      estado: 'borrador',
    },
    premios: [
      { nombre: 'Gran Premio',    cantidad: 1, monto: 1000.00, descripcion_premio: null, orden: 1 },
      { nombre: 'Segundo Premio', cantidad: 2, monto: 300.00,  descripcion_premio: null, orden: 2 },
      { nombre: 'Tercer Premio',  cantidad: 3, monto: 100.00,  descripcion_premio: null, orden: 3 },
    ],
    participantes: { total: 5, confirmados: 0, rechazados: 0 },
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function rand9()   { return '9' + String(Math.floor(Math.random() * 90_000_000) + 10_000_000) }

function buildEstados({ total, confirmados, rechazados }) {
  const estados = [
    ...Array(confirmados).fill('confirmado'),
    ...Array(rechazados).fill('rechazado'),
    ...Array(total - confirmados - rechazados).fill('pendiente'),
  ]
  // Fisher-Yates shuffle
  for (let i = estados.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [estados[i], estados[j]] = [estados[j], estados[i]]
  }
  return estados
}

// ── Seed principal ───────────────────────────────────────────────────────────

for (const item of SORTEOS_SEED) {
  // ── Idempotencia: omitir si ya existe ──
  const { data: existing } = await supabase
    .from('sorteos')
    .select('id')
    .eq('nombre', item.sorteo.nombre)
    .maybeSingle()

  if (existing) {
    console.log(`  ⏭  Omitiendo "${item.sorteo.nombre}" (ya existe)`)
    continue
  }

  // ── 1. Sorteo ──
  const { data: sorteo, error: errSorteo } = await supabase
    .from('sorteos')
    .insert(item.sorteo)
    .select()
    .single()

  if (errSorteo) { console.error(`Error creando sorteo "${item.sorteo.nombre}":`, errSorteo.message); continue }

  // ── 2. Premios ──
  const { data: premios, error: errPremios } = await supabase
    .from('premios')
    .insert(item.premios.map(p => ({ ...p, sorteo_id: sorteo.id, visible: true })))
    .select()

  if (errPremios) { console.error('Error creando premios:', errPremios.message); continue }

  // ── 3. Participantes ──
  const estados = buildEstados(item.participantes)
  let contador = 1

  const participantesRows = estados.map(estado => ({
    sorteo_id:        sorteo.id,
    nombres:          pick(NOMBRES),
    apellidos:        `${pick(APELLIDOS)} ${pick(APELLIDOS)}`,
    whatsapp:         rand9(),
    comprobante_path: `comprobantes/fake_${Math.random().toString(36).slice(2)}.jpg`,
    estado,
    nota_interna:     estado === 'rechazado' ? 'Comprobante ilegible.' : null,
    numero_registro:  null,
  }))

  // Asignar numero_registro a los confirmados (secuencial dentro del sorteo)
  for (const p of participantesRows) {
    if (p.estado === 'confirmado') {
      p.numero_registro = '#' + String(contador++).padStart(4, '0')
    }
  }

  const { data: participantes, error: errPart } = await supabase
    .from('participantes')
    .insert(participantesRows)
    .select()

  if (errPart) { console.error('Error creando participantes:', errPart.message); continue }

  // ── 4. Ganadores (solo sorteos cerrados) ──
  if (sorteo.estado === 'cerrado') {
    const confirmados = participantes
      .filter(p => p.estado === 'confirmado')
      .sort(() => Math.random() - 0.5) // shuffle

    const usados = new Set()
    const ganadoresRows = []

    for (const premio of premios) {
      let asignados = 0
      for (const participante of confirmados) {
        if (asignados >= premio.cantidad) break
        if (usados.has(participante.id)) continue
        ganadoresRows.push({
          sorteo_id:       sorteo.id,
          participante_id: participante.id,
          premio_id:       premio.id,
          publicado:       Math.random() < 0.5,
        })
        usados.add(participante.id)
        asignados++
      }
    }

    if (ganadoresRows.length) {
      const { error: errGan } = await supabase.from('ganadores').insert(ganadoresRows)
      if (errGan) console.error('Error creando ganadores:', errGan.message)
    }
  }

  const pConf = participantesRows.filter(p => p.estado === 'confirmado').length
  const pRech = participantesRows.filter(p => p.estado === 'rechazado').length
  const pPend = participantesRows.filter(p => p.estado === 'pendiente').length
  console.log(`  ✓  "${sorteo.nombre}" [${sorteo.estado}] — ${premios.length} premios | ${pConf} conf / ${pRech} rech / ${pPend} pend`)
}

console.log('\nSeed completado.')
