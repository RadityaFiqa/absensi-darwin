import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Edit, Trash2, X, Check, Map, Plus } from "lucide-react";
import Card from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import Toast from "@/components/Toast";
import axiosInstance from "@/lib/axios";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

interface Location {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
}

export const AdminLocations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formLatitude, setFormLatitude] = useState("");
  const [formLongitude, setFormLongitude] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get('/api/locations');
      if (response.data && response.data.success) {
        setLocations(response.data.locations);
      } else {
        setError(response.data.message || 'Gagal memuat lokasi');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  const openAddModal = () => {
    setEditingLocation(null);
    setFormName("");
    setFormAddress("");
    setFormLatitude("");
    setFormLongitude("");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (loc: Location) => {
    setEditingLocation(loc);
    setFormName(loc.name);
    setFormAddress(loc.address || "");
    setFormLatitude(String(loc.latitude));
    setFormLongitude(String(loc.longitude));
    setFormIsActive(loc.is_active);
    setIsModalOpen(true);
  };

  const handleStatusToggle = async (loc: Location) => {
    try {
      const targetStatus = !loc.is_active;
      const response = await axiosInstance.put(`/api/locations/${loc.id}`, {
        name: loc.name,
        address: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
        is_active: targetStatus,
      });

      if (response.data && response.data.success) {
        setToast({ message: `Status lokasi ${loc.name} berhasil diperbarui`, type: 'success' });
        fetchLocations();
      } else {
        setToast({ message: response.data.message || 'Gagal memperbarui status lokasi', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Terjadi kesalahan jaringan', type: 'error' });
    }
  };

  const handleDelete = async (loc: Location) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus lokasi ${loc.name}?`)) return;

    try {
      const response = await axiosInstance.delete(`/api/locations/${loc.id}`);
      if (response.data && response.data.success) {
        setToast({ message: `Lokasi ${loc.name} berhasil dihapus`, type: 'success' });
        fetchLocations();
      } else {
        setToast({ message: response.data.message || 'Gagal menghapus lokasi', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Gagal menghapus lokasi', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formLatitude || !formLongitude) {
      setToast({ message: 'Kolom Nama, Latitude, dan Longitude wajib diisi', type: 'error' });
      return;
    }

    const latNum = parseFloat(formLatitude);
    const lngNum = parseFloat(formLongitude);

    if (isNaN(latNum) || isNaN(lngNum)) {
      setToast({ message: 'Latitude dan Longitude harus berupa angka koordinat valid', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formName,
        address: formAddress,
        latitude: latNum,
        longitude: lngNum,
        is_active: formIsActive,
      };

      let response;
      if (editingLocation) {
        response = await axiosInstance.put(`/api/locations/${editingLocation.id}`, payload);
      } else {
        response = await axiosInstance.post('/api/locations', payload);
      }

      if (response.data && response.data.success) {
        setToast({ message: editingLocation ? 'Lokasi berhasil diperbarui' : 'Lokasi baru berhasil disimpan', type: 'success' });
        setIsModalOpen(false);
        fetchLocations();
      } else {
        setToast({ message: response.data.message || 'Gagal menyimpan lokasi', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Gagal menyimpan data lokasi', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header Panel */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Manajemen Lokasi</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Kelola kantor / gudang titik presensi karyawan</p>
        </div>
        <Button 
          onClick={openAddModal}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
        >
          Lokasi Baru
        </Button>
      </div>

      {/* Locations List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 rounded-2xl text-amber-700 text-xs font-bold">
          {error}
        </div>
      ) : locations.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-400 dark:text-zinc-655 font-bold border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl">
          Belum ada lokasi kantor/gudang terdaftar di sistem
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {locations.map((loc) => (
            <Card key={loc.id} className="p-4 border-zinc-100 dark:border-zinc-900 shadow-sm flex justify-between items-start hover:border-zinc-200 dark:hover:border-zinc-850 transition-colors">
              <div className="flex flex-col gap-1 max-w-[70%]">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-150 leading-tight">
                    {loc.name}
                  </h3>
                  <span className={`text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full ${
                    loc.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/25 dark:text-emerald-400' : 'bg-zinc-50 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-650'
                  }`}>
                    {loc.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-400 dark:text-zinc-500 pt-0.5">
                  <Navigation className="w-3 h-3 text-zinc-400" />
                  GPS: {loc.latitude}, {loc.longitude}
                </div>
                {loc.address && (
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-bold whitespace-pre-line mt-1">
                    {loc.address}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2.5 items-end shrink-0">
                {/* Status Toggle Button */}
                <button
                  onClick={() => handleStatusToggle(loc)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold cursor-pointer border shadow-xs transition-colors ${
                    loc.is_active 
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-400 border-zinc-100 dark:bg-zinc-900/30 dark:text-zinc-650 dark:border-zinc-850'
                  }`}
                  title={loc.is_active ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'}
                >
                  {loc.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                  {loc.is_active ? 'Aktif' : 'Nonaktif'}
                </button>

                {/* Edit & Delete Actions */}
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEditModal(loc)}
                    className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer border border-zinc-100 dark:border-zinc-850 transition-colors"
                    title="Ubah Detail Lokasi"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(loc)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 hover:text-red-600 cursor-pointer border border-red-100/50 dark:border-red-900/30 transition-colors"
                    title="Hapus Lokasi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <Card className="w-full max-w-sm flex flex-col gap-4 bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 shadow-2xl relative animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-900">
              <h3 className="text-sm font-black text-zinc-950 dark:text-zinc-50">
                {editingLocation ? 'Perbarui Lokasi' : 'Daftarkan Lokasi Baru'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-y-auto max-h-[70vh] pr-1">
              <Input
                label="NAMA KANTOR / GUDANG"
                placeholder="Contoh: Gudang BULOG Andang"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <div className="w-full flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 dark:text-zinc-400 tracking-wide">
                  ALAMAT DETAIL LOKASI
                </label>
                <textarea
                  placeholder="Masukkan alamat lengkap lokasi..."
                  rows={3}
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full rounded-2xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-650 focus:border-blue-500 focus:ring-blue-500/20 py-3 px-4 resize-none font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <Input
                  label="GARIS LINTANG (LATITUDE)"
                  placeholder="Contoh: -2.681077"
                  value={formLatitude}
                  onChange={(e) => setFormLatitude(e.target.value)}
                  required
                />
                <Input
                  label="GARIS BUJUR (LONGITUDE)"
                  placeholder="Contoh: 115.326151"
                  value={formLongitude}
                  onChange={(e) => setFormLongitude(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsActiveLoc"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 border border-zinc-200 rounded text-blue-600 focus:ring-blue-500/20"
                />
                <label htmlFor="formIsActiveLoc" className="text-xs font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer">
                  Lokasi ini Aktif (Tampil di Opsi Karyawan)
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-zinc-100 dark:border-zinc-900">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 py-3.5 text-xs font-bold"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1 py-3.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                  isLoading={submitting}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Simpan
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminLocations;
