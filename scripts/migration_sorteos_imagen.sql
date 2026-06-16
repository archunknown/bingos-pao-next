-- Agregar columna de imagen a la tabla sorteos
ALTER TABLE sorteos ADD COLUMN IF NOT EXISTS imagen_path TEXT;

-- Crear bucket público para imágenes de sorteos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sorteos',
  'sorteos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Política: lectura pública sin autenticación
CREATE POLICY IF NOT EXISTS "sorteos_images_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sorteos');
