"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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

function AbsensiContent() {
  const searchParams = useSearchParams();
  const preselectedKegiatanId = searchParams.get("kegiatan_id") || "";

  const [formData, setFormData] = useState({
    nama: "",
    nim: "",
    prodi: "",
    semester: 1,
    kegiatan_id: "",
  });

  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [loading, setLoading] = useState(false);
  const [signatureData, setSignatureData] = useState<string>("");
  const [hasDrawn, setHasDrawn] = useState(false);

  const [successData, setSuccessData] = useState<{
    nama: string;
    nim: string;
    prodi: string;
    semester: number;
    kegiatan_nama: string;
    lokasi: string;
    waktu: string;
    tanggal: string;
    id: string;
    signature?: string;
  } | null>(null);

  const [error, setError] = useState("");
  const [loadingKegiatan, setLoadingKegiatan] = useState(true);

  // Canvas ref for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    async function fetchKegiatan() {
      try {
        const { data, error } = await supabase
          .from("kegiatan")
          .select("*")
          .eq("is_active", true)
          .order("tanggal", { ascending: true });

        if (error) throw error;
        setKegiatanList(data || []);

        if (preselectedKegiatanId) {
          setFormData((prev) => ({ ...prev, kegiatan_id: preselectedKegiatanId }));
        } else if (data && data.length > 0) {
          setFormData((prev) => ({ ...prev, kegiatan_id: data[0].id }));
        }
      } catch (err) {
        console.error("Gagal memuat kegiatan:", err);
      } finally {
        setLoadingKegiatan(false);
      }
    }

    fetchKegiatan();
  }, [preselectedKegiatanId]);

  const selectedKegiatanDetail = kegiatanList.find((k) => k.id === formData.kegiatan_id);

  // Initialize canvas
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas dimensions based on CSS display size for crisp lines
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = "#1e1b4b";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    initCanvas();
    window.addEventListener("resize", initCanvas);
    return () => window.removeEventListener("resize", initCanvas);
  }, [initCanvas]);

  // Drawing handlers
  function getCoordinates(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }

  function startDrawing(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawingRef.current = true;
    setHasDrawn(true);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function stopDrawing() {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData(canvas.toDataURL("image/png"));
    }
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData("");
    setHasDrawn(false);
  }

  // Generate and download E-Certificate
  function downloadCertificate() {
    if (!successData) return;

    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 1130;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 1600, 1130);
    bgGradient.addColorStop(0, "#ffffff");
    bgGradient.addColorStop(1, "#f8fafc");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, 1600, 1130);

    // Decorative Borders
    ctx.strokeStyle = "#4338ca";
    ctx.lineWidth = 14;
    ctx.strokeRect(40, 40, 1520, 1050);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 3;
    ctx.strokeRect(55, 55, 1490, 1020);

    // Header badge
    ctx.fillStyle = "#4338ca";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("PRESENSI DIGITAL KAMPUS", 800, 150);

    // Certificate Title
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 64px sans-serif";
    ctx.fillText("SERTIFIKAT KEHADIRAN", 800, 240);

    ctx.fillStyle = "#64748b";
    ctx.font = "italic 26px sans-serif";
    ctx.fillText("Nomor Bukti: " + successData.id.toUpperCase(), 800, 290);

    ctx.fillStyle = "#475569";
    ctx.font = "28px sans-serif";
    ctx.fillText("Diberikan kepada mahasiswa / pengunjung di bawah ini:", 800, 370);

    // Recipient Name
    ctx.fillStyle = "#1e1b4b";
    ctx.font = "bold 62px sans-serif";
    ctx.fillText(successData.nama, 800, 470);

    // Underline for name
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(350, 495);
    ctx.lineTo(1250, 495);
    ctx.stroke();

    // NIM & Prodi
    ctx.fillStyle = "#334155";
    ctx.font = "30px sans-serif";
    ctx.fillText(
      `NIM: ${successData.nim}  •  ${successData.prodi}  •  Semester ${successData.semester}`,
      800,
      560
    );

    // Event Participation Description
    ctx.fillStyle = "#475569";
    ctx.font = "28px sans-serif";
    ctx.fillText("Telah hadir dan berpartisipasi secara resmi dalam kegiatan:", 800, 640);

    ctx.fillStyle = "#4338ca";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(successData.kegiatan_nama, 800, 715);

    ctx.fillStyle = "#64748b";
    ctx.font = "24px sans-serif";
    ctx.fillText(`Lokasi: ${successData.lokasi}  •  Waktu: ${successData.waktu} WIB`, 800, 765);

    // Footer Signatures
    ctx.textAlign = "left";
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Panitia Pelaksana Kegiatan", 240, 930);
    ctx.fillStyle = "#64748b";
    ctx.font = "20px sans-serif";
    ctx.fillText("Terverifikasi Sistem Presensi", 240, 965);

    // Draw participant signature if available
    if (successData.signature) {
      const sigImg = new Image();
      sigImg.onload = () => {
        ctx.drawImage(sigImg, 1150, 840, 220, 100);
        ctx.textAlign = "right";
        ctx.fillStyle = "#0f172a";
        ctx.font = "bold 22px sans-serif";
        ctx.fillText(successData.nama, 1370, 960);
        ctx.fillStyle = "#64748b";
        ctx.font = "20px sans-serif";
        ctx.fillText("Tanda Tangan Peserta", 1370, 990);

        triggerDownload(canvas, successData.nama, successData.kegiatan_nama);
      };
      sigImg.src = successData.signature;
      return;
    }

    triggerDownload(canvas, successData.nama, successData.kegiatan_nama);
  }

  function triggerDownload(canvas: HTMLCanvasElement, nama: string, eventName: string) {
    const link = document.createElement("a");
    link.download = `Sertifikat-${nama.replace(/\s+/g, "_")}-${eventName.replace(/\s+/g, "_")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!formData.nama.trim() || !formData.nim.trim() || !formData.prodi || !formData.kegiatan_id) {
      setError("Mohon lengkapi semua data yang bertanda bintang (*).");
      setLoading(false);
      return;
    }

    const cleanedNIM = formData.nim.trim().toUpperCase();

    try {
      // Cek apakah sudah pernah absen di kegiatan ini
      const { data: existing } = await supabase
        .from("absensi")
        .select("id")
        .eq("nim", cleanedNIM)
        .eq("kegiatan_id", formData.kegiatan_id)
        .maybeSingle();

      if (existing) {
        setError(`NIM ${cleanedNIM} sudah tercatat hadir pada kegiatan ini!`);
        setLoading(false);
        return;
      }

      const nowIso = new Date().toISOString();
      const { data: inserted, error: insertError } = await supabase
        .from("absensi")
        .insert([
          {
            nama: formData.nama.trim(),
            nim: cleanedNIM,
            prodi: formData.prodi,
            semester: Number(formData.semester),
            kegiatan_id: formData.kegiatan_id,
            waktu_absen: nowIso,
          },
        ])
        .select("id")
        .single();

      if (insertError) throw insertError;

      setSuccessData({
        id: inserted?.id || Math.random().toString(36).substring(2, 9),
        nama: formData.nama.trim(),
        nim: cleanedNIM,
        prodi: formData.prodi,
        semester: Number(formData.semester),
        kegiatan_nama: selectedKegiatanDetail?.nama_kegiatan || "Kegiatan Kampus",
        lokasi: selectedKegiatanDetail?.lokasi || "Kampus",
        tanggal: selectedKegiatanDetail?.tanggal || new Date().toISOString().split("T")[0],
        waktu: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        signature: signatureData || undefined,
      });

      // Reset
      setFormData({
        nama: "",
        nim: "",
        prodi: "",
        semester: 1,
        kegiatan_id: kegiatanList[0]?.id || "",
      });
      clearSignature();
    } catch {
      setError("Gagal menyimpan data absensi. Pastikan koneksi internet stabil.");
    } finally {
      setLoading(false);
    }
  }

  const prodiOptions = [
    "Teknik Informatika",
    "Sistem Informasi",
    "Teknik Elektro",
    "Teknik Mesin",
    "Teknik Sipil",
    "Manajemen",
    "Akuntansi",
    "Ilmu Komunikasi",
    "Desain Komunikasi Visual (DKV)",
    "Hukum",
    "Psikologi",
    "Kedokteran",
    "Farmasi",
    "Pendidikan / Keguruan",
    "Lainnya",
  ];

  // Bukti Hadir Digital Card
  if (successData) {
    return (
      <div className="min-h-screen bg-mesh py-8 sm:py-16 px-4 flex items-center justify-center font-sans">
        <div className="max-w-md w-full animate-fade-in-up">
          {/* Success Banner */}
          <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-4 mb-4 flex items-center gap-3 shadow-sm no-print">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-emerald-500/20">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-emerald-900 text-sm">Presensi Berhasil Dicatat!</h3>
              <p className="text-xs text-emerald-700">Simpan bukti digital ini atau unduh E-Sertifikat resmi Anda.</p>
            </div>
          </div>

          {/* Digital E-Ticket Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden print-ticket">
            {/* Header Badge */}
            <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white p-6 relative overflow-hidden">
              <div className="flex items-center justify-between relative z-10">
                <span className="text-xs font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md">
                  Bukti Kehadiran
                </span>
                <span className="text-xs text-indigo-100 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Terverifikasi
                </span>
              </div>
              <h2 className="text-xl font-bold mt-3 relative z-10 leading-snug">
                {successData.kegiatan_nama}
              </h2>
              <p className="text-xs text-indigo-100 mt-1 flex items-center gap-1.5 relative z-10">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {successData.lokasi}
              </p>
            </div>

            {/* Ticket body details */}
            <div className="p-6 space-y-4 text-slate-800">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">NAMA LENGKAP</span>
                  <span className="font-bold text-slate-900 mt-0.5 block truncate">{successData.nama}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">NIM / ID</span>
                  <span className="font-bold font-mono text-indigo-600 mt-0.5 block">{successData.nim}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block font-medium">PROGRAM STUDI</span>
                  <span className="font-medium text-slate-700 mt-0.5 block truncate">{successData.prodi}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block font-medium">SEMESTER</span>
                  <span className="font-medium text-slate-700 mt-0.5 block">Semester {successData.semester}</span>
                </div>
              </div>

              {/* Signature preview if provided */}
              {successData.signature && (
                <div className="pb-3 border-b border-slate-100">
                  <span className="text-xs text-slate-400 block font-medium mb-1">TANDA TANGAN MAHASISWA</span>
                  <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={successData.signature} alt="Tanda Tangan" className="h-14 object-contain" />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Waktu Presensi:</span>
                <span className="font-semibold text-slate-800">{successData.waktu} WIB</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2 no-print">
              {/* E-Certificate Download Button */}
              <button
                onClick={downloadCertificate}
                className="w-full inline-flex items-center justify-center gap-2 gradient-btn text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Unduh E-Sertifikat Digital (PNG HD)</span>
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSuccessData(null)}
                  className="flex-1 inline-flex items-center justify-center py-2 px-3 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
                >
                  Input Lagi
                </button>

                <Link
                  href="/"
                  className="flex-1 inline-flex items-center justify-center py-2 px-3 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Kembali ke Beranda
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh py-8 sm:py-12 px-4 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-xl mx-auto">
        {/* Navigation back */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-indigo-600 bg-white/80 backdrop-blur px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Kembali ke Beranda</span>
          </Link>

          <span className="text-xs text-slate-500 font-medium bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-200/60">
            Form Presensi Mahasiswa
          </span>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Form Kehadiran Acara</h1>
            <p className="text-indigo-100 text-xs sm:text-sm mt-1.5">
              Silakan lengkapi formulir di bawah ini dengan data diri Anda yang valid.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 shadow-sm">
                <svg className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Field 1: Kegiatan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Pilih Kegiatan / Acara <span className="text-rose-500">*</span>
                </label>
                {loadingKegiatan ? (
                  <div className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ) : kegiatanList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                    Saat ini belum ada kegiatan aktif yang dibuka. Hubungi panitia atau admin acara.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <select
                      value={formData.kegiatan_id}
                      onChange={(e) => setFormData({ ...formData, kegiatan_id: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                      required
                    >
                      {kegiatanList.map((k) => (
                        <option key={k.id} value={k.id}>
                          {k.nama_kegiatan} — ({new Date(k.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" })})
                        </option>
                      ))}
                    </select>

                    {selectedKegiatanDetail && (
                      <div className="p-3.5 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs text-slate-600 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 font-medium text-indigo-900">
                          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span>{selectedKegiatanDetail.lokasi || "Lokasi Kampus"}</span>
                        </div>
                        {selectedKegiatanDetail.deskripsi && (
                          <p className="text-slate-500 mt-0.5 line-clamp-1">{selectedKegiatanDetail.deskripsi}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Field 2: Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  2. Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Muhammad Rizky Pratama"
                  className="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              {/* Field 3: NIM */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  3. Nomor Induk Mahasiswa (NIM) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.nim}
                    onChange={(e) => setFormData({ ...formData, nim: e.target.value.replace(/\s+/g, "").toUpperCase() })}
                    placeholder="Contoh: 2110511099"
                    className="w-full px-4 py-3 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-sm font-mono tracking-wide text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                    required
                  />
                  {formData.nim.length >= 5 && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Pastikan NIM sudah benar (1 NIM hanya dapat mengisi absen 1 kali per kegiatan).
                </p>
              </div>

              {/* Field 4: Program Studi */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  4. Program Studi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.prodi}
                  onChange={(e) => setFormData({ ...formData, prodi: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Program Studi --</option>
                  {prodiOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 5: Semester (Interactive Pills) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  5. Semester Saat Ini <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, semester: s })}
                      className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                        formData.semester === s
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20 scale-105"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 border border-slate-200/60"
                      }`}
                    >
                      Smtr {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 6: Digital Signature Pad */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    6. Tanda Tangan Digital (Opsional)
                  </label>
                  {hasDrawn && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold transition-colors"
                    >
                      Hapus / Ulangi
                    </button>
                  )}
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-2 bg-slate-50/50 relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-32 bg-white rounded-xl cursor-crosshair touch-none border border-slate-200"
                  />
                  {!hasDrawn && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400">
                      Goreskan tanda tangan Anda dengan jari atau mouse di sini
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || kegiatanList.length === 0}
                className="w-full gradient-btn text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Menyimpan Presensi...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Kirim Presensi Kehadiran</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AbsensiPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-mesh flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <AbsensiContent />
    </Suspense>
  );
}
