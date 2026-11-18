"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

interface AbsensiItem {
  id: string;
  nama: string;
  nim: string;
  prodi: string;
  semester: number;
  waktu_absen: string;
}

function LaporanContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialKegiatanId = searchParams.get("kegiatan_id") || "";

  const [authenticated, setAuthenticated] = useState(false);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [selectedId, setSelectedId] = useState<string>(initialKegiatanId);
  const [currentKegiatan, setCurrentKegiatan] = useState<Kegiatan | null>(null);
  const [pesertaList, setPesertaList] = useState<AbsensiItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings for the printable report
  const [formatTandaTangan, setFormatTandaTangan] = useState<"paraf" | "digital">("paraf");
  const [namaKetuaPanitia, setNamaKetuaPanitia] = useState("Ketua Pelaksana Kegiatan");
  const [nimKetuaPanitia, setNimKetuaPanitia] = useState("");
  const [namaPembina, setNamaPembina] = useState("Dosen Pembina / Kaprodi");
  const [nipPembina, setNipPembina] = useState("");
  const [nomorSurat, setNomorSurat] = useState("BA-PRESENSI/KAMPUS/2026");
  const [showConfig, setShowConfig] = useState(false);

  // Verify admin authentication
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    fetch("/api/admin/verify", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setAuthenticated(true);
        } else {
          localStorage.removeItem("admin_token");
          router.push("/admin/login");
        }
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [router]);

  // Load list of events
  useEffect(() => {
    if (!authenticated) return;

    async function loadEvents() {
      try {
        const { data, error } = await supabase
          .from("kegiatan")
          .select("*")
          .order("tanggal", { ascending: false });

        if (!error && data) {
          setKegiatanList(data);
          if (initialKegiatanId) {
            setSelectedId(initialKegiatanId);
          } else if (data.length > 0) {
            setSelectedId(data[0].id);
          }
        }
      } catch (err) {
        console.error("Gagal memuat kegiatan:", err);
      }
    }

    loadEvents();
  }, [authenticated, initialKegiatanId]);

  // Load selected event details & attendees
  const loadReportData = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);

    try {
      const selected = kegiatanList.find((k) => k.id === selectedId) || null;
      setCurrentKegiatan(selected);

      const { data, error } = await supabase
        .from("absensi")
        .select("*")
        .eq("kegiatan_id", selectedId)
        .order("waktu_absen", { ascending: true });

      if (!error && data) {
        setPesertaList(data);
      }
    } catch (err) {
      console.error("Gagal memuat data presensi:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedId, kegiatanList]);

  useEffect(() => {
    if (authenticated && selectedId) {
      loadReportData();
    }
  }, [authenticated, selectedId, loadReportData]);

  const handlePrint = () => {
    window.print();
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">Memverifikasi otentikasi admin...</p>
        </div>
      </div>
    );
  }

  const tanggalCetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans print:bg-white print:text-black">
      {/* Floating Action Bar (Hidden in Print) */}
      <div className="no-print sticky top-0 z-40 bg-white border-b border-slate-300 shadow-sm px-4 sm:px-6 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors btn-interactive"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Dashboard</span>
            </Link>

            <span className="text-xs font-bold text-slate-400">|</span>

            {/* Event Selector */}
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-900 text-slate-800 cursor-pointer max-w-xs truncate"
            >
              {kegiatanList.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama_kegiatan}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle Config */}
            <button
              type="button"
              onClick={() => setShowConfig(!showConfig)}
              className="text-xs font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors btn-interactive flex items-center gap-1.5"
            >
              <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{showConfig ? "Tutup Pengaturan" : "Edit Pengesahan"}</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-lg bg-indigo-900 hover:bg-indigo-800 text-white shadow-sm transition-colors btn-interactive"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Cetak / Simpan PDF</span>
            </button>
          </div>
        </div>

        {/* Collapsible Config Drawer */}
        {showConfig && (
          <div className="max-w-6xl mx-auto mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Surat / Berita Acara</label>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Format Kolom Tanda Tangan</label>
              <select
                value={formatTandaTangan}
                onChange={(e) => setFormatTandaTangan(e.target.value as "paraf" | "digital")}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 cursor-pointer"
              >
                <option value="paraf">Format Paraf Fisik (Berjenjang 1... 2...)</option>
                <option value="digital">Verifikasi Presensi Digital</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Ketua Panitia</label>
              <input
                type="text"
                value={namaKetuaPanitia}
                onChange={(e) => setNamaKetuaPanitia(e.target.value)}
                placeholder="Nama Lengkap Ketua"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 mb-1"
              />
              <input
                type="text"
                value={nimKetuaPanitia}
                onChange={(e) => setNimKetuaPanitia(e.target.value)}
                placeholder="NIM Ketua Pelaksana"
                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-slate-900 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Pembina / Kaprodi</label>
              <input
                type="text"
                value={namaPembina}
                onChange={(e) => setNamaPembina(e.target.value)}
                placeholder="Nama Dosen Pembina"
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-slate-900 mb-1"
              />
              <input
                type="text"
                value={nipPembina}
                onChange={(e) => setNipPembina(e.target.value)}
                placeholder="NIP / NIDN Pembina"
                className="w-full px-2.5 py-1 bg-slate-50 border border-slate-300 rounded text-slate-900 font-mono text-[11px]"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main A4 Printable Document Container */}
      <main className="max-w-[210mm] mx-auto my-6 sm:my-8 bg-white p-8 sm:p-12 shadow-lg border border-slate-300 print:shadow-none print:border-none print:p-0 print:my-0">
        {/* Kop Surat Berita Acara */}
        <div className="text-center pb-4 border-b-4 border-double border-slate-900">
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-700">
            KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
          </p>
          <h1 className="text-lg sm:text-xl font-extrabold uppercase tracking-wide text-slate-900 mt-0.5">
            LEMBAR BERITA ACARA DAN DAFTAR HADIR PESERTA
          </h1>
          <p className="text-xs text-slate-600 mt-1 font-medium">
            Dokumen Resmi Rekapitulasi Presensi Kegiatan Mahasiswa
          </p>
          {nomorSurat && (
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              Nomor: {nomorSurat}
            </p>
          )}
        </div>

        {/* Info Kegiatan Box */}
        {currentKegiatan ? (
          <div className="my-5 p-4 rounded-lg bg-slate-50 border border-slate-300 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              <div className="flex">
                <span className="w-32 font-bold text-slate-700">Nama Kegiatan</span>
                <span className="mr-2">:</span>
                <span className="font-extrabold text-slate-900 flex-1">{currentKegiatan.nama_kegiatan}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700">Hari / Tanggal</span>
                <span className="mr-2">:</span>
                <span className="text-slate-800 flex-1">
                  {new Date(currentKegiatan.tanggal).toLocaleDateString("id-ID", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700">Tempat / Ruangan</span>
                <span className="mr-2">:</span>
                <span className="text-slate-800 flex-1">{currentKegiatan.lokasi || "Kampus"}</span>
              </div>
              <div className="flex">
                <span className="w-32 font-bold text-slate-700">Total Kehadiran</span>
                <span className="mr-2">:</span>
                <span className="font-bold text-indigo-900 flex-1">{pesertaList.length} Orang Mahasiswa</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="my-5 p-4 text-center text-xs text-slate-500 border border-dashed border-slate-300">
            {loading ? "Memuat data kegiatan..." : "Pilih kegiatan untuk mencetak berita acara."}
          </div>
        )}

        {/* Tabel Daftar Hadir Mahasiswa */}
        <div className="mt-6">
          <table className="w-full border-collapse border border-slate-400 text-xs text-left">
            <thead>
              <tr className="bg-slate-100 text-slate-800 font-bold uppercase text-[10px] tracking-wider">
                <th className="border border-slate-400 py-2.5 px-2 text-center w-10">No</th>
                <th className="border border-slate-400 py-2.5 px-3">Nama Lengkap Mahasiswa</th>
                <th className="border border-slate-400 py-2.5 px-2 text-center w-28">NIM</th>
                <th className="border border-slate-400 py-2.5 px-3">Program Studi</th>
                <th className="border border-slate-400 py-2.5 px-2 text-center w-16">Smtr</th>
                <th className="border border-slate-400 py-2.5 px-2 text-center w-16">Waktu</th>
                <th className="border border-slate-400 py-2.5 px-3 text-center w-36">
                  {formatTandaTangan === "paraf" ? "Tanda Tangan / Paraf" : "Status Kehadiran"}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="border border-slate-400 py-8 text-center text-slate-500">
                    Memuat daftar kehadiran peserta...
                  </td>
                </tr>
              ) : pesertaList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-slate-400 py-8 text-center text-slate-500 italic">
                    Belum ada mahasiswa yang tercatat hadir pada kegiatan ini.
                  </td>
                </tr>
              ) : (
                pesertaList.map((p, index) => {
                  const isOdd = (index + 1) % 2 !== 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="border border-slate-400 py-2 px-2 text-center font-medium">
                        {index + 1}
                      </td>
                      <td className="border border-slate-400 py-2 px-3 font-semibold text-slate-900">
                        {p.nama}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center font-mono text-slate-800">
                        {p.nim}
                      </td>
                      <td className="border border-slate-400 py-2 px-3 text-slate-700">
                        {p.prodi}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center text-slate-700">
                        {p.semester}
                      </td>
                      <td className="border border-slate-400 py-2 px-2 text-center text-slate-600 font-mono text-[11px]">
                        {new Date(p.waktu_absen).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="border border-slate-400 py-2 px-2">
                        {formatTandaTangan === "paraf" ? (
                          <div className={`h-8 flex items-center ${isOdd ? "justify-start pl-2" : "justify-end pr-2"}`}>
                            <span className="text-[10px] text-slate-400 font-mono font-bold mr-2">
                              {index + 1}.
                            </span>
                            <span className="w-16 border-b border-dotted border-slate-400 inline-block"></span>
                          </div>
                        ) : (
                          <div className="text-center text-[10px] font-semibold text-emerald-800">
                            ✓ Hadir (Sistem)
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Ringkasan & Lembar Pengesahan */}
        <div className="mt-10 page-break-inside-avoid text-xs sm:text-sm">
          <div className="flex justify-between items-start text-right mb-6">
            <div />
            <div>
              <p className="text-slate-700">Ditetapkan di: Kampus</p>
              <p className="text-slate-700 mt-0.5">Pada tanggal: {tanggalCetak}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 text-center mt-4">
            {/* Kolom Kiri: Ketua Panitia */}
            <div>
              <p className="font-semibold text-slate-700">Mengetahui,</p>
              <p className="font-bold text-slate-900 mt-0.5">Ketua Panitia Pelaksana</p>
              <div className="h-20 sm:h-24 flex items-end justify-center">
                <span className="text-[11px] text-slate-400 italic no-print">(Tanda Tangan & Cap)</span>
              </div>
              <p className="font-extrabold text-slate-900 underline uppercase">
                {namaKetuaPanitia || "................................................"}
              </p>
              {nimKetuaPanitia ? (
                <p className="text-slate-600 font-mono text-xs mt-0.5">NIM. {nimKetuaPanitia}</p>
              ) : (
                <p className="text-slate-400 text-xs mt-0.5">NIM. ....................................</p>
              )}
            </div>

            {/* Kolom Kanan: Dosen Pembina / Kaprodi */}
            <div>
              <p className="font-semibold text-slate-700">Menyetujui,</p>
              <p className="font-bold text-slate-900 mt-0.5">Dosen Pembina / Ketua Jurusan</p>
              <div className="h-20 sm:h-24 flex items-end justify-center">
                <span className="text-[11px] text-slate-400 italic no-print">(Tanda Tangan & Cap)</span>
              </div>
              <p className="font-extrabold text-slate-900 underline uppercase">
                {namaPembina || "................................................"}
              </p>
              {nipPembina ? (
                <p className="text-slate-600 font-mono text-xs mt-0.5">NIP/NIDN. {nipPembina}</p>
              ) : (
                <p className="text-slate-400 text-xs mt-0.5">NIP/NIDN. ....................................</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Dokumen */}
        <div className="mt-12 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center">
          <span>Dicetak melalui Sistem Presensi Kampus</span>
          <span>Halaman 1 dari 1</span>
        </div>
      </main>
    </div>
  );
}

export default function LaporanPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">Memuat laporan presensi...</p>
          </div>
        </div>
      }
    >
      <LaporanContent />
    </Suspense>
  );
}
