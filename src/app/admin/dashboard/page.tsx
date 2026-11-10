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
      console.error("Error fetching data:", err);
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
    if (!confirm("Yakin ingin menghapus kegiatan ini? Data absensi terkait juga akan terhapus.")) return;

    try {
      // Delete related absensi first
      await supabase.from("absensi").delete().eq("kegiatan_id", id);
      const { error } = await supabase.from("kegiatan").delete().eq("id", id);
      if (error) throw error;
      fetchData();
    } catch {
      alert("Gagal menghapus kegiatan.");
    }
  }

  async function deleteAbsensi(id: string) {
    if (!confirm("Yakin ingin menghapus data absensi ini?")) return;

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

  function exportCSV() {
    const filtered = filteredAbsensi();
    if (filtered.length === 0) {
      alert("Tidak ada data untuk di-export.");
      return;
    }

    const headers = ["No", "Nama", "NIM", "Prodi", "Semester", "Kegiatan", "Waktu Absen"];
    const rows = filtered.map((a, i) => [
      i + 1,
      a.nama,
      a.nim,
      a.prodi,
      a.semester,
      a.kegiatan?.nama_kegiatan || "-",
      new Date(a.waktu_absen).toLocaleString("id-ID"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `absensi-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function filteredAbsensi() {
    return absensiList.filter((a) => {
      const matchSearch =
        searchQuery === "" ||
        a.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.nim.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.prodi.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }

  if (!authenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Memuat...
        </div>
      </div>
    );
  }

  const filtered = filteredAbsensi();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
                <p className="text-blue-100 text-sm">Kelola absensi & kegiatan</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-white/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted">Total Absensi</p>
                <p className="text-2xl font-bold text-foreground">{absensiList.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success-light rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted">Total Kegiatan</p>
                <p className="text-2xl font-bold text-foreground">{kegiatanList.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning-light rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-muted">Kegiatan Aktif</p>
                <p className="text-2xl font-bold text-foreground">
                  {kegiatanList.filter((k) => k.is_active).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-card rounded-lg p-1 border border-border mb-6 w-fit">
          <button
            onClick={() => setActiveTab("absensi")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "absensi"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            📋 Data Absensi
          </button>
          <button
            onClick={() => setActiveTab("kegiatan")}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === "kegiatan"
                ? "bg-primary text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            📅 Kelola Kegiatan
          </button>
        </div>

        {/* Tab Content: Absensi */}
        {activeTab === "absensi" && (
          <div className="bg-card rounded-xl shadow-sm border border-border">
            <div className="p-4 sm:p-6 border-b border-border">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="flex-1 relative">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, NIM, atau prodi..."
                    className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder-muted focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                {/* Filter */}
                <select
                  value={selectedKegiatan}
                  onChange={(e) => setSelectedKegiatan(e.target.value)}
                  className="px-4 py-2.5 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                >
                  <option value="all">Semua Kegiatan</option>
                  {kegiatanList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama_kegiatan}
                    </option>
                  ))}
                </select>
                {/* Export */}
                <button
                  onClick={exportCSV}
                  className="bg-success hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-background">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Nama</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">NIM</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Prodi</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Semester</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Kegiatan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Waktu</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-muted">
                        {searchQuery ? "Tidak ada data yang cocok." : "Belum ada data absensi."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((a, i) => (
                      <tr key={a.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-4 py-3 text-sm">{i + 1}</td>
                        <td className="px-4 py-3 text-sm font-medium">{a.nama}</td>
                        <td className="px-4 py-3 text-sm font-mono">{a.nim}</td>
                        <td className="px-4 py-3 text-sm">{a.prodi}</td>
                        <td className="px-4 py-3 text-sm text-center">{a.semester}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="bg-primary-light text-primary px-2 py-1 rounded-md text-xs font-medium">
                            {a.kegiatan?.nama_kegiatan || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted">
                          {new Date(a.waktu_absen).toLocaleString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => deleteAbsensi(a.id)}
                            className="text-danger hover:text-red-800 transition-colors"
                            title="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div className="px-4 py-3 border-t border-border text-sm text-muted">
              Menampilkan {filtered.length} dari {absensiList.length} data
            </div>
          </div>
        )}

        {/* Tab Content: Kegiatan */}
        {activeTab === "kegiatan" && (
          <div>
            {/* Add Kegiatan Button */}
            <div className="mb-4">
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Tambah Kegiatan
              </button>
            </div>

            {/* Add Kegiatan Form */}
            {showForm && (
              <div className="bg-card rounded-xl shadow-sm border border-border p-6 mb-6">
                <h3 className="text-lg font-semibold mb-4">Tambah Kegiatan Baru</h3>
                <form onSubmit={handleAddKegiatan} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nama Kegiatan *</label>
                    <input
                      type="text"
                      value={formKegiatan.nama_kegiatan}
                      onChange={(e) => setFormKegiatan({ ...formKegiatan, nama_kegiatan: e.target.value })}
                      placeholder="Contoh: Seminar Nasional IT"
                      className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Tanggal *</label>
                    <input
                      type="date"
                      value={formKegiatan.tanggal}
                      onChange={(e) => setFormKegiatan({ ...formKegiatan, tanggal: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Lokasi</label>
                    <input
                      type="text"
                      value={formKegiatan.lokasi}
                      onChange={(e) => setFormKegiatan({ ...formKegiatan, lokasi: e.target.value })}
                      placeholder="Contoh: Aula Kampus Utama"
                      className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Deskripsi</label>
                    <input
                      type="text"
                      value={formKegiatan.deskripsi}
                      onChange={(e) => setFormKegiatan({ ...formKegiatan, deskripsi: e.target.value })}
                      placeholder="Deskripsi singkat kegiatan"
                      className="w-full px-4 py-2.5 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                    />
                  </div>
                  <div className="sm:col-span-2 flex gap-3">
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="bg-primary hover:bg-primary-hover disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                    >
                      {formLoading ? "Menyimpan..." : "Simpan"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="bg-background hover:bg-border text-foreground px-6 py-2.5 rounded-lg font-medium transition-colors border border-border"
                    >
                      Batal
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Kegiatan List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {kegiatanList.length === 0 ? (
                <div className="sm:col-span-2 lg:col-span-3 bg-card rounded-xl border border-border p-12 text-center text-muted">
                  Belum ada kegiatan. Klik &quot;Tambah Kegiatan&quot; untuk memulai.
                </div>
              ) : (
                kegiatanList.map((k) => (
                  <div
                    key={k.id}
                    className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-foreground">{k.nama_kegiatan}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          k.is_active
                            ? "bg-success-light text-success"
                            : "bg-danger-light text-danger"
                        }`}
                      >
                        {k.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </div>
                    {k.deskripsi && (
                      <p className="text-sm text-muted mb-2">{k.deskripsi}</p>
                    )}
                    <div className="text-sm text-muted space-y-1 mb-4">
                      <p>
                        📅{" "}
                        {new Date(k.tanggal).toLocaleDateString("id-ID", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      {k.lokasi && <p>📍 {k.lokasi}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleKegiatanStatus(k.id, k.is_active)}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          k.is_active
                            ? "bg-warning-light text-warning hover:bg-yellow-200"
                            : "bg-success-light text-success hover:bg-green-200"
                        }`}
                      >
                        {k.is_active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => deleteKegiatan(k.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-danger-light text-danger hover:bg-red-200 transition-colors"
                      >
                        Hapus
                      </button>
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

