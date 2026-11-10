# 🎓 Web Presensi Kegiatan Kampus

Aplikasi web presensi digital modern dan ringan untuk acara/kegiatan kampus (seminar, workshop, webinar, dll.) yang terhubung langsung ke **Supabase** sebagai database cloud realtime.

---

## ✨ Fitur Utama

- 📝 **Form Presensi Cepat & Responsif**: Pengunjung/mahasiswa mengisi data diri (Nama, NIM, Program Studi, Semester) dalam waktu singkat.
- 🚫 **Anti-Double Submission**: Sistem otomatis menolak input NIM ganda untuk kegiatan yang sama.
- 🎫 **Bukti Kehadiran Digital**: Tampilan kartu kehadiran instan setelah absensi berhasil.
- 📊 **Portal Admin Lengkap**:
  - Kelola kegiatan (tambah, aktifkan/nonaktifkan, hapus).
  - Rekap daftar absensi realtime dengan fitur pencarian dan filter kegiatan.
  - Export data absensi ke format **CSV / Excel** dalam satu klik.
- 📱 **Mobile-First & Ringan**: Tampilan dioptimalkan untuk smartphone pengunjung.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Database**: [Supabase](https://supabase.com/) (PostgreSQL & Realtime)

---

## 🚀 Panduan Menjalankan Project

### 1. Clone Repository & Install Dependencies
```bash
git clone <url-repo-anda>
cd "web absen"
npm install
```

### 2. Konfigurasi Environment Variable
Buat file `.env.local` dari template `.env.example`:
```bash
cp .env.example .env.local
```
Lengkapi nilai:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
ADMIN_PASSWORD=admin123
```

### 3. Setup Database Supabase
Jalankan script query SQL yang ada di file [`supabase-setup.sql`](./supabase-setup.sql) pada **SQL Editor** di dashboard Supabase Anda.

### 4. Jalankan Server Development
```bash
npm run dev
# atau jika Windows WASM:
npx next dev --webpack
```

Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 🔐 Akses Admin Default
- URL: `http://localhost:3000/admin/login`
- Password: `admin123` *(Dapat disesuaikan di file `.env.local`)*

---

## 📄 Lisensi
Dibuat untuk keperluan kegiatan kampus. Lisensi terbuka (MIT).
