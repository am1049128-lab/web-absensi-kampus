"use client";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import QRCode from "qrcode";
import Link from "next/link";

interface Kegiatan {
  id: string;
  nama_kegiatan: string;
  deskripsi: string;
  tanggal: string;
  lokasi: string;
  is_active: boolean;
}

interface Peserta {
  id: string;
  nama: string;
  nim: string;
  prodi: string;
  semester: number;
  waktu_absen: string;
}

function ProyektorContent() {
  const searchParams = useSearchParams();
  const kegiatanIdParam = searchParams.get("kegiatan_id") || "";

  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [selectedId, setSelectedId] = useState<string>(kegiatanIdParam);
  const [currentKegiatan, setCurrentKegiatan] = useState<Kegiatan | null>(null);
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [latestAttendee, setLatestAttendee] = useState<Peserta | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [countPopping, setCountPopping] = useState(false);

  const tickerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all active events
  useEffect(() => {
    async function loadEvents() {
      try {
        const { data, error } = await supabase
          .from("kegiatan")
          .select("*")
          .order("tanggal", { ascending: false });

        if (!error && data) {
          setKegiatanList(data);
          if (kegiatanIdParam) {
            setSelectedId(kegiatanIdParam);
          } else if (data.length > 0) {
            setSelectedId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Gagal memuat kegiatan:", err);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [kegiatanIdParam]);

  // Load selected event details & attendees
  useEffect(() => {
    if (!selectedId) return;

    const ev = kegiatanList.find((k) => k.id === selectedId) || null;
    setCurrentKegiatan(ev);

    // Generate QR Code
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      const absenUrl = `${origin}/absensi?kegiatan_id=${selectedId}`;
      QRCode.toDataURL(absenUrl, {
        width: 420,
        margin: 2,
        color: {
          dark: "#1e1b4b",
          light: "#ffffff",
        },
      }).then((url) => setQrDataUrl(url));
    }

    // Fetch existing attendees
    async function fetchAttendees() {
      const { data, error } = await supabase
        .from("absensi")
        .select("*")
        .eq("kegiatan_id", selectedId)
        .order("waktu_absen", { ascending: false });

      if (!error && data) {
        setPesertaList(data);
      }
    }
    fetchAttendees();

    // Setup Supabase Realtime channel
    const channel = supabase
      .channel(`realtime-absensi-${selectedId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "absensi",
          filter: `kegiatan_id=eq.${selectedId}`,
        },
        (payload) => {
          const newPeserta = payload.new as Peserta;
          setPesertaList((prev) => [newPeserta, ...prev]);

          // Trigger counter pop animation
          setCountPopping(true);
          setTimeout(() => setCountPopping(false), 500);

          // Show popup banner for newest attendee
          setLatestAttendee(newPeserta);
          if (tickerTimeoutRef.current) clearTimeout(tickerTimeoutRef.current);
          tickerTimeoutRef.current = setTimeout(() => {
            setLatestAttendee(null);
          }, 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedId, kegiatanList]);

  // Fullscreen toggle
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col justify-between overflow-x-hidden relative selection:bg-indigo-500 selection:text-white">
      {/* Background ambient glowing orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sky-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="relative z-20 border-b border-white/10 bg-slate-900/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/30">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              Presensi<span className="text-indigo-400">Kampus</span>
            </span>
          </Link>

          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            ● Mode Layar Panggung
          </span>
        </div>

        {/* Event selector & controls */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="font-mono text-lg font-bold text-slate-200 tracking-wider">{currentTime}</span>
            <span className="text-[11px] text-slate-400 block">WIB Realtime</span>
          </div>

          {kegiatanList.length > 1 && (
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 px-3 py-2 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {kegiatanList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kegiatan}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={toggleFullscreen}
            title="Layar Penuh (F11)"
            aria-label="Alihkan mode layar penuh"
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>

          <Link
            href="/admin/dashboard"
            className="text-xs font-semibold px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main Stage Grid */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex flex-col justify-center">
        {/* Banner Alert when new person checks in */}
        {latestAttendee && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-600 text-white shadow-2xl flex items-center justify-between animate-slide-down border border-emerald-400/40">
            <div className="flex items-center gap-3">
              <span className="text-2xl animate-scale-in">🎉</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  Presensi Baru Masuk!
                </p>
                <p className="text-base sm:text-lg font-extrabold">
                  {latestAttendee.nama} ({latestAttendee.prodi})
                </p>
              </div>
            </div>
            <span className="text-xs bg-black/20 px-3 py-1 rounded-full font-mono">
              NIM: {latestAttendee.nim}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Event details & QR Code */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-semibold mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Pintu Presensi Dibuka</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {currentKegiatan?.nama_kegiatan || "Memuat Kegiatan..."}
            </h1>

            {currentKegiatan?.deskripsi && (
              <p className="text-slate-400 text-sm sm:text-base mt-3 max-w-lg leading-relaxed">
                {currentKegiatan.deskripsi}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs sm:text-sm text-slate-300 font-medium">
              {currentKegiatan?.tanggal && (
                <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {new Date(currentKegiatan.tanggal).toLocaleDateString("id-ID", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}

              {currentKegiatan?.lokasi && (
                <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
                  <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>{currentKegiatan.lokasi}</span>
                </div>
              )}
            </div>

            {/* Instruction Card */}
            <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 max-w-md backdrop-blur-md">
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-1">
                Petunjuk Mahasiswa / Pengunjung:
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                Arahkan kamera HP Anda ke QR Code di samping untuk membuka formulir absensi langsung tanpa perlu mengetik alamat website.
              </p>
            </div>
          </div>

          {/* Right Column: High-contrast QR Code & Counter */}
          <div className="lg:col-span-6 flex flex-col items-center">
            {/* Live Counter Card */}
            <div className="w-full max-w-md bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 border-2 border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Total Mahasiswa Hadir
              </span>
              <div className="flex items-baseline gap-2">
                <span className={`text-6xl sm:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400 inline-block transition-transform ${countPopping ? "animate-count-pop" : ""}`}>
                  {pesertaList.length}
                </span>
                <span className="text-slate-400 font-semibold text-lg">Orang</span>
              </div>

              {/* QR Container with subtle scanning line animation */}
              <div className="mt-6 p-4 bg-white rounded-3xl shadow-xl border-4 border-indigo-400/30 relative overflow-hidden group">
                <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent pointer-events-none animate-scan-beam" />
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrDataUrl}
                    alt="QR Code Presensi"
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-2xl relative z-10"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                    Membuat QR Code...
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Scan dengan Kamera HP untuk Absen</span>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Live Feed Ticker */}
      <footer className="relative z-20 border-t border-white/10 bg-slate-900/80 backdrop-blur-md px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400 flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
            <span className="font-bold text-slate-300 uppercase">Live Feed:</span>
          </div>

          <div className="flex-1 overflow-x-auto flex items-center gap-3 no-scrollbar py-1 text-xs">
            {pesertaList.length === 0 ? (
              <span className="text-slate-500 italic">Menunggu peserta pertama yang mengisi presensi...</span>
            ) : (
              pesertaList.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="inline-flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-xl flex-shrink-0"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="font-bold text-slate-200">{p.nama}</span>
                  <span className="text-slate-400">({p.prodi})</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(p.waktu_absen).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function ProyektorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ProyektorContent />
    </Suspense>
  );
}
