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
    <div className="min-h-screen bg-mesh flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Presensi<span className="text-indigo-600">Kampus</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  Digital Event
                </span>
              </div>
            </Link>

            {/* Nav actions */}
            <div className="flex items-center gap-3">
              <Link
                href="/absensi"
                className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-3.5 py-2 rounded-lg hover:bg-indigo-50/70 transition-colors"
              >
                <span>Buka Form</span>
              </Link>

              <Link
                href="/admin/login"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 px-3.5 py-2 rounded-xl transition-colors border border-slate-200"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Portal Admin</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Live Indicator Pill */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs sm:text-sm font-medium mb-6 shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Sistem Presensi Aktif & Terhubung Supabase</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight">
              Presensi Acara Kampus Jadi Lebih{" "}
              <span className="gradient-text">Mudah & Cepat</span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Selamat datang di portal presensi kegiatan mahasiswa. Pengunjung cukup mengisi data diri dan memilih acara yang dihadiri dalam hitungan detik.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md mx-auto">
              <Link
                href="/absensi"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 gradient-btn text-white font-semibold px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 text-base"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>Isi Absensi Sekarang</span>
              </Link>

              <a
                href="#daftar-kegiatan"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-6 py-3.5 rounded-xl border border-slate-200/90 shadow-sm text-base transition-colors"
              >
                <span>Lihat Kegiatan Aktif</span>
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </a>
            </div>

            {/* Trust Badges */}
            <div className="mt-12 pt-8 border-t border-slate-200/60 max-w-2xl mx-auto grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {loading ? "..." : events.length}
                </p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Kegiatan Aktif</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-indigo-600">100%</p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Tanpa Kertas</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">&lt; 15s</p>
                <p className="text-xs sm:text-sm text-slate-500 font-medium">Waktu Pengisian</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Active Events List */}
        <section id="daftar-kegiatan" className="py-12 bg-white/70 backdrop-blur-md border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
              <div>
                <span className="text-xs font-bold tracking-wider uppercase text-indigo-600">
                  Jadwal & Acara
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  Kegiatan Kampus yang Tersedia
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Pilih salah satu kegiatan di bawah ini untuk langsung mengisi absensi.
                </p>
              </div>

              <Link
                href="/absensi"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                <span>Formulir Kosong</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="bg-slate-100/80 rounded-2xl p-6 h-48 animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-800">Belum Ada Kegiatan Aktif</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                  Silakan masuk ke Portal Admin untuk menambahkan kegiatan baru yang siap dibuka untuk presensi.
                </p>
                <Link
                  href="/admin/login"
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                >
                  Tambah Kegiatan di Admin
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top status & date badge */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Buka Absensi
                        </span>
                        <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {new Date(ev.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {ev.nama_kegiatan}
                      </h3>

                      {ev.deskripsi && (
                        <p className="text-sm text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                          {ev.deskripsi}
                        </p>
                      )}

                      {ev.lokasi && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{ev.lokasi}</span>
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        Input oleh Pengunjung
                      </span>
                      <Link
                        href={`/absensi?kegiatan_id=${ev.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all duration-150"
                      >
                        <span>Absen Sekarang</span>
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section: Simple 3 Steps */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Alur Pengisian
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                Presensi Hanya Dalam 3 Langkah
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-panel rounded-2xl p-6 text-center relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  1
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">Pilih Acara</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Pilih kegiatan seminar, workshop, atau organisasi kampus yang Anda hadiri hari ini.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-6 text-center relative">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  2
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">Lengkapi Data Diri</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Cukup masukkan Nama, NIM, Program Studi, dan Semester aktif Anda.
                </p>
              </div>

              <div className="glass-panel rounded-2xl p-6 text-center relative">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg mx-auto mb-4">
                  3
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5">Bukti Digital Terbit</h3>
                <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                  Data langsung tersimpan di cloud & Anda mendapatkan kartu bukti kehadiran digital instan.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 PresensiKampus. Sistem Absensi Digital Terintegrasi Supabase.</p>
          <div className="flex items-center gap-4">
            <Link href="/absensi" className="hover:text-indigo-600 transition-colors">
              Form Absensi
            </Link>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-indigo-600 transition-colors">
              Masuk Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
