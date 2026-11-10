"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface Kegiatan {
  id: string;
  nama_kegiatan: string;
  deskripsi: string;
  tanggal: string;
  lokasi: string;
  is_active: boolean;
}

export default function AbsensiPage() {
  const [formData, setFormData] = useState({
    nama: "",
    nim: "",
    prodi: "",
    semester: "",
    kegiatan_id: "",
  });
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [loadingKegiatan, setLoadingKegiatan] = useState(true);

  useEffect(() => {
    fetchKegiatan();
  }, []);

  async function fetchKegiatan() {
    try {
      const { data, error } = await supabase
        .from("kegiatan")
        .select("*")
        .eq("is_active", true)
        .order("tanggal", { ascending: false });

      if (error) throw error;
      setKegiatanList(data || []);
    } catch {
      console.error("Error fetching kegiatan");
    } finally {
      setLoadingKegiatan(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Validasi
    if (!formData.nama || !formData.nim || !formData.prodi || !formData.semester || !formData.kegiatan_id) {
      setError("Semua field harus diisi!");
      setLoading(false);
      return;
    }

    try {
      // Cek apakah sudah absen
      const { data: existing } = await supabase
        .from("absensi")
        .select("id")
        .eq("nim", formData.nim)
        .eq("kegiatan_id", formData.kegiatan_id)
        .single();

      if (existing) {
        setError("NIM ini sudah terdaftar untuk kegiatan ini!");
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase.from("absensi").insert([
        {
          nama: formData.nama,
          nim: formData.nim,
          prodi: formData.prodi,
          semester: parseInt(formData.semester),
          kegiatan_id: formData.kegiatan_id,
          waktu_absen: new Date().toISOString(),
        },
      ]);

      if (insertError) throw insertError;

      setSuccess(true);
      setFormData({ nama: "", nim: "", prodi: "", semester: "", kegiatan_id: "" });
    } catch {
      setError("Terjadi kesalahan saat menyimpan data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md w-full text-center">
          <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
            <div className="w-20 h-20 bg-success-light rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Absensi Berhasil! ✅
            </h2>
            <p className="text-muted mb-6">
              Data kehadiran Anda telah berhasil disimpan. Terima kasih telah mengisi absensi.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setSuccess(false)}
                className="bg-primary hover:bg-primary-hover text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
              >
                Isi Lagi
              </button>
              <Link
                href="/"
                className="bg-card hover:bg-background text-foreground px-6 py-2.5 rounded-lg font-medium transition-colors border border-border"
              >
                Kembali
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const prodiOptions = [
    "Teknik Informatika",
    "Sistem Informasi",
    "Teknik Elektro",
    "Teknik Mesin",
    "Teknik Sipil",
    "Manajemen",
    "Akuntansi",
    "Hukum",
    "Psikologi",
    "Kedokteran",
    "Farmasi",
    "Ilmu Komunikasi",
    "Desain Komunikasi Visual",
    "Arsitektur",
    "Sastra Inggris",
    "Pendidikan",
    "Lainnya",
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Form Absensi</h1>
              <p className="text-blue-100 text-sm">Isi data kehadiran Anda</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-foreground">Data Kehadiran</h2>
            <p className="text-muted text-sm mt-1">
              Lengkapi semua data di bawah ini
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-danger-light border border-danger/20 text-danger rounded-lg px-4 py-3 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Kegiatan */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Kegiatan <span className="text-danger">*</span>
              </label>
              {loadingKegiatan ? (
                <div className="animate-pulse bg-background rounded-lg h-11" />
              ) : kegiatanList.length === 0 ? (
                <p className="text-muted text-sm bg-warning-light rounded-lg px-4 py-3">
                  Belum ada kegiatan yang tersedia. Hubungi admin untuk menambahkan kegiatan.
                </p>
              ) : (
                <select
                  value={formData.kegiatan_id}
                  onChange={(e) =>
                    setFormData({ ...formData, kegiatan_id: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  required
                >
                  <option value="">-- Pilih Kegiatan --</option>
                  {kegiatanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kegiatan} — {new Date(k.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Nama */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nama Lengkap <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                placeholder="Masukkan nama lengkap"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                required
              />
            </div>

            {/* NIM */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                NIM <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={formData.nim}
                onChange={(e) =>
                  setFormData({ ...formData, nim: e.target.value })
                }
                placeholder="Masukkan NIM"
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                required
              />
            </div>

            {/* Prodi */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Program Studi <span className="text-danger">*</span>
              </label>
              <select
                value={formData.prodi}
                onChange={(e) =>
                  setFormData({ ...formData, prodi: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                required
              >
                <option value="">-- Pilih Program Studi --</option>
                {prodiOptions.map((prodi) => (
                  <option key={prodi} value={prodi}>
                    {prodi}
                  </option>
                ))}
              </select>
            </div>

            {/* Semester */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Semester <span className="text-danger">*</span>
              </label>
              <select
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                required
              >
                <option value="">-- Pilih Semester --</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || kegiatanList.length === 0}
              className="w-full bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Kirim Absensi
                </>
              )}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

