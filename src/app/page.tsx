"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Kegiatan {
  id: string;
  nama_kegiatan: string;
  deskripsi: string;
  tanggal: string;
  lokasi: string;
  is_active: boolean;
}

export default function Home() {
  const [events, setEvents] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadActiveEvents() {
      try {
        const { data, error } = await supabase
          .from("kegiatan")
          .select("*")
          .eq("is_active", true)
          .order("tanggal", { ascending: true });

        if (!error && data) {
          setEvents(data);
        }
      } catch (err) {
        console.error("Gagal mengambil data kegiatan:", err);
      } finally {
        setLoading(false);
      }
    }

    loadActiveEvents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-900 flex items-center justify-center text-white font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900">
                  Presensi<span className="text-indigo-900">Kampus</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Portal Resmi
                </span>
              </div>
            </Link>

            {/* Nav actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/absensi"
                className="hidden sm:inline-flex items-center text-sm font-semibold text-indigo-900 hover:text-indigo-700 px-3.5 py-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Formulir Presensi
              </Link>

              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-lg transition-colors border border-slate-200"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Portal Panitia / Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-14 sm:pt-16 sm:pb-20 border-b border-slate-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Sistem Presensi Digital Kegiatan Kampus
            </h1>

            <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Catat kehadiran Anda pada seminar, lokakarya, dan agenda kegiatan mahasiswa dengan verifikasi instan serta penerbitan bukti kehadiran resmi.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
              <Link
                href="/absensi"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-indigo-900 hover:bg-indigo-800 text-white font-semibold px-6 py-3 rounded-lg shadow-sm text-sm transition-colors"
              >
                Isi Presensi Kehadiran
              </Link>

              <a
                href="#daftar-kegiatan"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-white hover:bg-slate-50 text-slate-700 font-semibold px-5 py-3 rounded-lg border border-slate-300 text-sm transition-colors"
              >
                Lihat Agenda Hari Ini
              </a>
            </div>

            {/* Factual Status */}
            <div className="mt-10 pt-6 border-t border-slate-200 max-w-sm mx-auto flex items-center justify-center gap-6 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Database Terhubung</span>
              </div>
              <div className="border-l border-slate-200 pl-6">
                <span>{loading ? "Memuat agenda..." : `${events.length} Kegiatan Aktif Terbuka`}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Active Events List */}
        <section id="daftar-kegiatan" className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Kegiatan yang Sedang Dibuka
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Pilih kegiatan yang Anda ikuti untuk langsung mengisi data presensi kehadiran.
              </p>
            </div>

            <Link
              href="/absensi"
              className="text-xs sm:text-sm font-semibold text-indigo-900 hover:underline"
            >
              Buka Formulir Kosong
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-100 rounded-xl p-6 h-48 animate-pulse border border-slate-200" />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-slate-200 bg-white">
              <h3 className="text-sm font-bold text-slate-800">Belum Ada Kegiatan Aktif</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Panitia pelaksana belum membuka sesi presensi untuk kegiatan saat ini.
              </p>
              <Link
                href="/admin/login"
                className="mt-4 inline-flex items-center text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-900 text-white hover:bg-indigo-800 transition-colors"
              >
                Buka Portal Admin
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between shadow-sm hover:border-slate-300 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Presensi Terbuka
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(ev.tanggal).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                      {ev.nama_kegiatan}
                    </h3>

                    {ev.deskripsi && (
                      <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                        {ev.deskripsi}
                      </p>
                    )}

                    {ev.lokasi && (
                      <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                        <svg className="w-3.5 h-3.5 text-indigo-800 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">{ev.lokasi}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      Sesi Mahasiswa
                    </span>
                    <Link
                      href={`/absensi?kegiatan_id=${ev.id}`}
                      className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-900 text-white hover:bg-indigo-800 transition-colors"
                    >
                      Buka Form Presensi
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section: Prosedur & Tata Tertib Presensi */}
        <section className="py-12 bg-white border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6 text-center sm:text-left">
              Ketentuan dan Informasi Presensi
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-sm text-slate-900 mb-1">
                  1 NIM untuk 1 Kali Presensi
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Sistem database secara otomatis menolak pencatatan ganda pada kegiatan yang sama untuk menjamin validitas kehadiran.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-sm text-slate-900 mb-1">
                  Penerbitan Bukti Digital
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Setelah mengirim data, Anda dapat langsung menyimpan kartu bukti kehadiran serta mengunduh E-Sertifikat resmi kegiatan.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-sm text-slate-900 mb-1">
                  Akses Tanpa Akun
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pengunjung tidak diwajibkan mendaftar akun; cukup melengkapi identitas NIM, Program Studi, dan Semester aktif.
                </p>
              </div>

              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50">
                <h3 className="font-semibold text-sm text-slate-900 mb-1">
                  Tampilan Proyektor Panggung
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Panitia dapat menayangkan layar QR Code dan pemantau jumlah kehadiran secara langsung melalui portal admin.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-6 text-xs border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Presensi Kampus. Sistem Pencatatan Kehadiran Acara Mahasiswa.</p>
          <div className="flex items-center gap-4">
            <Link href="/absensi" className="hover:text-white transition-colors">
              Form Presensi
            </Link>
            <span>•</span>
            <Link href="/proyektor" className="hover:text-white transition-colors">
              Layar Proyektor
            </Link>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-white transition-colors">
              Masuk Panitia
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
