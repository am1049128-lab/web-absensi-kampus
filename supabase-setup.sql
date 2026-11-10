-- =============================================
-- SQL Setup untuk Web Absensi Kampus
-- Jalankan SQL ini di Supabase SQL Editor
-- =============================================

-- 1. Tabel Kegiatan
CREATE TABLE IF NOT EXISTS kegiatan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama_kegiatan TEXT NOT NULL,
  deskripsi TEXT,
  tanggal DATE NOT NULL,
  lokasi TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Absensi
CREATE TABLE IF NOT EXISTS absensi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  nim TEXT NOT NULL,
  prodi TEXT NOT NULL,
  semester INTEGER NOT NULL CHECK (semester >= 1 AND semester <= 8),
  kegiatan_id UUID NOT NULL REFERENCES kegiatan(id) ON DELETE CASCADE,
  waktu_absen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Index untuk pencarian cepat
CREATE INDEX IF NOT EXISTS idx_absensi_nim ON absensi(nim);
CREATE INDEX IF NOT EXISTS idx_absensi_kegiatan ON absensi(kegiatan_id);
CREATE INDEX IF NOT EXISTS idx_kegiatan_active ON kegiatan(is_active);

-- 4. Unique constraint: 1 NIM hanya bisa absen 1x per kegiatan
ALTER TABLE absensi ADD CONSTRAINT unique_nim_kegiatan UNIQUE (nim, kegiatan_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE absensi ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies - Allow public read & insert (for anon users)
-- Kegiatan: public can read active kegiatan
CREATE POLICY "Public can view active kegiatan"
  ON kegiatan FOR SELECT
  USING (true);

CREATE POLICY "Public can insert kegiatan"
  ON kegiatan FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update kegiatan"
  ON kegiatan FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete kegiatan"
  ON kegiatan FOR DELETE
  USING (true);

-- Absensi: public can read and insert
CREATE POLICY "Public can view absensi"
  ON absensi FOR SELECT
  USING (true);

CREATE POLICY "Public can insert absensi"
  ON absensi FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can delete absensi"
  ON absensi FOR DELETE
  USING (true);

-- 7. Insert sample kegiatan (optional, hapus jika tidak perlu)
INSERT INTO kegiatan (nama_kegiatan, deskripsi, tanggal, lokasi, is_active)
VALUES
  ('Seminar Nasional Teknologi 2026', 'Seminar tentang perkembangan teknologi terkini', '2026-11-15', 'Aula Utama Kampus', true),
  ('Workshop Web Development', 'Workshop pembuatan website menggunakan Next.js', '2026-11-20', 'Lab Komputer Lt. 3', true),
  ('Kuliah Umum Kewirausahaan', 'Kuliah umum tentang membangun startup', '2026-11-25', 'Auditorium Kampus', true);

