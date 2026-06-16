-- Datos de DNI y ubicación por participante (NULL cuando no se consultó)
ALTER TABLE participantes
  ADD COLUMN IF NOT EXISTS dni          TEXT,
  ADD COLUMN IF NOT EXISTS departamento TEXT,
  ADD COLUMN IF NOT EXISTS provincia    TEXT,
  ADD COLUMN IF NOT EXISTS distrito     TEXT,
  ADD COLUMN IF NOT EXISTS direccion    TEXT;
