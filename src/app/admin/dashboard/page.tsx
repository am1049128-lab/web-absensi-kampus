"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Absensi {
  id: string;
  nama: string;
  nim: string;
  prodi: string;
  semester: number;
  waktu_absen: string;
  kegiatan_id: string;
  kegiatan: {
    nama_kegiatan: string;
  };
}

interface Kegiatan {
  id: string;
  nama_kegiatan: string;
  deskripsi: string;
  tanggal: string;
  lokasi: string;
  is_active: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const [absensiList, setAbsensiList] = useState<Absensi[]>([]);
  const [kegiatanList, setKegiatanList] = useState<Kegiatan[]>([]);
  const [activeTab, setActiveTab] = useState<"absensi" | "kegiatan">("absensi");
  const [selectedKegiatan, setSelectedKegiatan] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const router = useRouter();

  // Form kegiatan baru
  const [showForm, setShowForm] = useState(false);
  const [formKegiatan, setFormKegiatan] = useState({
    nama_kegiatan: "",
    deskripsi: "",
    tanggal: "",
    lokasi: "",
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    // Verify token
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch kegiatan
      const { data: kData } = await supabase
        .from("kegiatan")
        .select("*")
        .order("tanggal", { ascending: false });

      setKegiatanList(kData || []);

      // Fetch absensi with kegiatan info
      let query = supabase
        .from("absensi")
        .select("*, kegiatan(nama_kegiatan)")
        .order("waktu_absen", { ascending: false });

      if (selectedKegiatan !== "all") {
        query = query.eq("kegiatan_id", selectedKegiatan);
      }

      const { data: aData } = await query;
      setAbsensiList(aData || []);
    } catch (err) {
      console.error("Gagal mengambil data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedKegiatan]);

  useEffect(() => {
    if (authenticated) {
      fetchData();
    }
  }, [authenticated, fetchData]);

  async function handleAddKegiatan(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);

    try {
      const { error } = await supabase.from("kegiatan").insert([
        {
          ...formKegiatan,
          is_active: true,
        },
      ]);

      if (error) throw error;

      setFormKegiatan({ nama_kegiatan: "", deskripsi: "", tanggal: "", lokasi: "" });
      setShowForm(false);
      fetchData();
    } catch {
      alert("Gagal menambahkan kegiatan.");
    } finally {
      setFormLoading(false);
    }
  }

  async function toggleKegiatanStatus(id: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from("kegiatan")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;
      fetchData();
    } catch {
      alert("Gagal mengubah status kegiatan.");
    }
  }

  async function deleteKegiatan(id: string) {
    if (!confirm("Yakin ingin menghapus kegiatan ini? Semua data absensi terkait acara ini juga akan dihapus.")) return;

    try {
      await supabase.from("absensi").delete().eq("kegiatan_id", id);
      const { error } = await supabase.from("kegiatan").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch {
      alert("Gagal menghapus kegiatan.");
    }
  }

  async function deleteAbsensi(id: string) {
    if (!confirm("Yakin ingin menghapus data absensi peserta ini?")) return;

    try {
      const { error } = await supabase.from("absensi").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch {
      alert("Gagal menghapus data absensi.");
    }
  }

  function handleLogout() {
    localStorage.removeItem("admin_token");
    router.push("/admin/login");
  }

  function copyAbsenLink(kegiatanId: string) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/absensi?kegiatan_id=${kegiatanId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(kegiatanId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function exportCSV() {
    const filtered = filteredAbsensi();
    if (filtered.length === 0) {
      alert("Tidak ada data untuk di-export.");
      return;
    }

    const headers = ["No", "Nama Lengkap", "NIM", "Program Studi", "Semester", "Kegiatan", "Waktu Presensi"];
    const rows = filtered.map((a, i) => [
      i + 1,
      `"${a.nama.replace(/"/g, '""')}"`,
      `"${a.nim}"`,
      `"${a.prodi}"`,
      a.semester,
      `"${a.kegiatan?.nama_kegiatan || "-"}"`,
      `"${new Date(a.waktu_absen).toLocaleString("id-ID")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-absensi-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function filteredAbsensi() {
    return absensiList.filter((a) => {
      const q = searchQuery.toLowerCase();
      return (
        searchQuery === "" ||
        a.nama.toLowerCase().includes(q) ||
        a.nim.toLowerCase().includes(q) ||
        a.prodi.toLowerCase().includes(q)
      );
    });
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const filtered = filteredAbsensi();

  return (
    <div className="min-h-screen bg-mesh font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-3">
              <Link href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>
              <div>
                <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">Dashboard Admin</h1>
                <p className="text-xs text-slate-500">Kelola Presensi & Kegiatan Kampus</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/proyektor"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl border border-slate-700 transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>📺 Mode Proyektor</span>
              </Link>

              <Link
                href="/absensi"
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-xl border border-indigo-200 transition-colors"
              >
                <span>Buka Form Absen</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 rounded-xl border border-rose-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Kehadiran</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{absensiList.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Kegiatan</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{kegiatanList.length}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kegiatan Aktif</p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
                {kegiatanList.filter((k) => k.is_active).length}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mb-6 bg-slate-200/60 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab("absensi")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "absensi"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span>Daftar Presensi ({absensiList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("kegiatan")}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === "kegiatan"
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Kelola Acara ({kegiatanList.length})</span>
          </button>
        </div>

        {/* TAB 1: ABSENSI */}
        {activeTab === "absensi" && (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            {/* Filter toolbar */}
            <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                {/* Search input */}
                <div className="relative flex-1">
                  <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, NIM, atau prodi..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all placeholder:text-slate-400"
                  />
                </div>

                {/* Event Filter dropdown */}
                <select
                  value={selectedKegiatan}
                  onChange={(e) => setSelectedKegiatan(e.target.value)}
                  className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all cursor-pointer"
                >
                  <option value="all">Semua Kegiatan</option>
                  {kegiatanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kegiatan}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchData}
                  title="Segarkan data"
                  className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <svg className={`w-4 h-4 ${loading ? "animate-spin text-indigo-600" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>

                <button
                  onClick={exportCSV}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2.5 rounded-xl shadow-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-4">No</th>
                    <th className="py-3.5 px-4">Nama Lengkap</th>
                    <th className="py-3.5 px-4">NIM</th>
                    <th className="py-3.5 px-4">Program Studi</th>
                    <th className="py-3.5 px-4">Semester</th>
                    <th className="py-3.5 px-4">Kegiatan</th>
                    <th className="py-3.5 px-4">Waktu</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p>Memuat data presensi...</p>
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        {searchQuery ? "Tidak ditemukan data yang sesuai kata kunci pencarian." : "Belum ada data presensi yang masuk."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-400 text-xs">{idx + 1}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{item.nama}</td>
                        <td className="py-3.5 px-4 font-mono text-indigo-600 font-semibold">{item.nim}</td>
                        <td className="py-3.5 px-4 text-slate-600">{item.prodi}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            Smtr {item.semester}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {item.kegiatan?.nama_kegiatan || "-"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                          {new Date(item.waktu_absen).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          WIB
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => deleteAbsensi(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus data"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
              <span>Menampilkan {filtered.length} dari {absensiList.length} data</span>
            </div>
          </div>
        )}

        {/* TAB 2: KEGIATAN */}
        {activeTab === "kegiatan" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Daftar Kegiatan Kampus</h2>
                <p className="text-xs text-slate-500">Kelola kegiatan yang dibuka untuk formulir absensi pengunjung</p>
              </div>

              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white gradient-btn px-4 py-2.5 rounded-xl shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span>{showForm ? "Tutup Form" : "Tambah Kegiatan"}</span>
              </button>
            </div>

            {/* Form Tambah Kegiatan */}
            {showForm && (
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-lg p-6 sm:p-8 mb-6 animate-fade-in-up">
                <h3 className="text-base font-bold text-slate-900 mb-4">Tambah Kegiatan Baru</h3>
                <form onSubmit={handleAddKegiatan} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Nama Kegiatan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formKegiatan.nama_kegiatan}
                      onChange={(e) => setFormKegiatan({ ...formKegiatan, nama_kegiatan: e.target.value })}
                      placeholder="Contoh: Seminar Nasional AI & Cloud 2026"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Tanggal Pelaksanaan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={formKegiatan.tanggal}
                      onChange={(e) => setFormKegiatan({ ...formKegiatan, tanggal: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Lokasi / Ruangan
                    </label>
                    <input
                      type="text"
                      value={formKegiatan.lokasi}
                      onChange={(e) => setFormKegiatan({ ...formKegiatan, lokasi: e.target.value })}
                      placeholder="Contoh: Auditorium Gedung B Lt. 4"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Deskripsi Singkat
                    </label>
                    <input
                      type="text"
                      value={formKegiatan.deskripsi}
                      onChange={(e) => setFormKegiatan({ ...formKegiatan, deskripsi: e.target.value })}
                      placeholder="Keterangan singkat acara..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-end gap-2.5 mt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-white gradient-btn shadow-md disabled:opacity-50 transition-all"
                    >
                      {formLoading ? "Menyimpan..." : "Simpan Kegiatan"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* List of Kegiatan */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {kegiatanList.length === 0 ? (
                <div className="col-span-full bg-white rounded-3xl p-12 text-center border border-slate-200 text-slate-400">
                  Belum ada kegiatan yang dibuat. Klik tombol &ldquo;Tambah Kegiatan&rdquo; di atas untuk memulai.
                </div>
              ) : (
                kegiatanList.map((k) => (
                  <div
                    key={k.id}
                    className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow relative"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            k.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}
                        >
                          {k.is_active ? "● Aktif (Buka Absensi)" : "○ Nonaktif (Tutup)"}
                        </span>

                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(k.tanggal).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 line-clamp-1">{k.nama_kegiatan}</h3>
                      {k.deskripsi && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{k.deskripsi}</p>}

                      {k.lokasi && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                          <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span className="truncate">{k.lokasi}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      {/* Projector and copy buttons */}
                      <div className="flex gap-2">
                        <Link
                          href={`/proyektor?kegiatan_id=${k.id}`}
                          target="_blank"
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                        >
                          <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Layar Proyektor</span>
                        </Link>

                        <button
                          onClick={() => copyAbsenLink(k.id)}
                          title="Salin Link Presensi"
                          className="p-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                        >
                          {copiedId === k.id ? (
                            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleKegiatanStatus(k.id, k.is_active)}
                          className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-colors ${
                            k.is_active
                              ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                          }`}
                        >
                          {k.is_active ? "Tutup Absensi" : "Buka Absensi"}
                        </button>

                        <button
                          onClick={() => deleteKegiatan(k.id)}
                          className="py-1.5 px-3 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
