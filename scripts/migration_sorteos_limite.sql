-- Límite opcional de participantes por sorteo (NULL = sin límite)
ALTER TABLE sorteos ADD COLUMN IF NOT EXISTS limite_participantes INTEGER CHECK (limite_participantes IS NULL OR limite_participantes > 0);
