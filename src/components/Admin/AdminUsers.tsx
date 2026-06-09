import React, { useState, useEffect } from "react";
import { Search, UserPlus, Edit, Trash2, Shield, UserCheck, UserX, X, Check, Building, Briefcase } from "lucide-react";
import Card from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import Input from "@/components/UI/Input";
import Toast from "@/components/Toast";
import axiosInstance from "@/lib/axios";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

interface User {
  id: number;
  employee_no: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
  is_active: boolean;
}

export const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formEmployeeNo, setFormEmployeeNo] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formRole, setFormRole] = useState<'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE'>('EMPLOYEE');
  const [formIsActive, setFormIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('is_active', statusFilter);

      const response = await axiosInstance.get(`/api/users?${params.toString()}`);
      if (response.data && response.data.success) {
        setUsers(response.data.users);
      } else {
        setError(response.data.message || 'Gagal memuat pengguna');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [search, roleFilter, statusFilter]);

  const openAddModal = () => {
    setEditingUser(null);
    setFormEmployeeNo("");
    setFormName("");
    setFormEmail("");
    setFormDepartment("");
    setFormDesignation("");
    setFormRole("EMPLOYEE");
    setFormIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormEmployeeNo(user.employee_no);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormDepartment(user.department || "");
    setFormDesignation(user.designation || "");
    setFormRole(user.role);
    setFormIsActive(user.is_active);
    setIsModalOpen(true);
  };

  const handleStatusToggle = async (user: User) => {
    try {
      const targetStatus = !user.is_active;
      const response = await axiosInstance.patch(`/api/users/${user.id}/status`, { is_active: targetStatus });
      if (response.data && response.data.success) {
        setToast({ message: `Status user ${user.name} berhasil diperbarui`, type: 'success' });
        fetchUsers();
      } else {
        setToast({ message: response.data.message || 'Gagal merubah status', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Gagal memproses data', type: 'error' });
    }
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user ${user.name} (${user.employee_no})?`)) return;

    try {
      const response = await axiosInstance.delete(`/api/users/${user.id}`);
      if (response.data && response.data.success) {
        setToast({ message: `User ${user.name} berhasil dihapus`, type: 'success' });
        fetchUsers();
      } else {
        setToast({ message: response.data.message || 'Gagal menghapus user', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Gagal menghapus user', type: 'error' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmployeeNo || !formName || !formEmail) {
      setToast({ message: 'Kolom Employee No, Nama, dan Email wajib diisi', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        employee_no: formEmployeeNo,
        name: formName,
        email: formEmail,
        department: formDepartment,
        designation: formDesignation,
        role: formRole,
        is_active: formIsActive,
      };

      let response;
      if (editingUser) {
        response = await axiosInstance.put(`/api/users/${editingUser.id}`, payload);
      } else {
        response = await axiosInstance.post('/api/users', payload);
      }

      if (response.data && response.data.success) {
        setToast({ message: editingUser ? 'Karyawan berhasil diperbarui' : 'Karyawan baru berhasil terdaftar', type: 'success' });
        setIsModalOpen(false);
        fetchUsers();
      } else {
        setToast({ message: response.data.message || 'Gagal menyimpan data', type: 'error' });
      }
    } catch (err: any) {
      setToast({ message: err.message || 'Gagal menyimpan data karyawan', type: 'error' });
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
          <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Manajemen Karyawan</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Kelola karyawan terdaftar dan perannya</p>
        </div>
        <Button 
          onClick={openAddModal}
          leftIcon={<UserPlus className="w-4 h-4" />}
          className="text-xs py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
        >
          Karyawan Baru
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-150 dark:border-zinc-900 flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400 pointer-events-none" />
          <input 
            type="text"
            placeholder="Cari berdasarkan nama atau employee no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs font-bold rounded-2xl border py-3 pl-10 pr-4 focus:outline-none focus:ring-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:ring-blue-500/20 placeholder-zinc-400"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full text-xs font-bold rounded-2xl border py-3 px-3 focus:outline-none focus:ring-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:ring-blue-500/20"
          >
            <option value="">Semua Peran / Role</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPERVISOR">SUPERVISOR</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs font-bold rounded-2xl border py-3 px-3 focus:outline-none focus:ring-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:ring-blue-500/20"
          >
            <option value="">Semua Status</option>
            <option value="true">Aktif</option>
            <option value="false">Nonaktif</option>
          </select>
        </div>
      </Card>

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 rounded-2xl text-amber-700 text-xs font-bold">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-400 dark:text-zinc-650 font-bold border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl">
          Tidak ada karyawan yang cocok dengan kriteria pencarian
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {users.map((user) => (
            <Card key={user.id} className="p-4 border-zinc-100 dark:border-zinc-900 shadow-sm flex justify-between items-start hover:border-zinc-200 dark:hover:border-zinc-850 transition-colors">
              <div className="flex flex-col gap-1.5 max-w-[70%]">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-150 leading-tight">
                    {user.name}
                  </h3>
                  <span className={`text-[8px] font-black tracking-wider px-2 py-0.5 rounded-full ${
                    user.role === 'ADMIN' ? 'bg-red-50 text-red-600 dark:bg-red-950/25 dark:text-red-400' :
                    user.role === 'SUPERVISOR' ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/25 dark:text-purple-400' :
                    'bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400'
                  }`}>
                    {user.role}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-semibold font-mono">
                  No: {user.employee_no}
                </div>
                <div className="text-[10px] text-zinc-500 font-bold">
                  {user.email}
                </div>
                {(user.department || user.designation) && (
                  <div className="flex gap-2.5 items-center text-[9px] text-zinc-400 dark:text-zinc-500 font-bold pt-1">
                    {user.department && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3 h-3 text-zinc-400" />
                        {user.department}
                      </span>
                    )}
                    {user.designation && (
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-zinc-400" />
                        {user.designation}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 items-end shrink-0">
                {/* Active Status Badge Button */}
                <button
                  onClick={() => handleStatusToggle(user)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-extrabold cursor-pointer border shadow-xs transition-colors ${
                    user.is_active 
                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' 
                      : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-400 border-zinc-100 dark:bg-zinc-900/30 dark:text-zinc-650 dark:border-zinc-850'
                  }`}
                  title={user.is_active ? 'Klik untuk Nonaktifkan' : 'Klik untuk Aktifkan'}
                >
                  {user.is_active ? <UserCheck className="w-3 h-3" /> : <UserX className="w-3 h-3" />}
                  {user.is_active ? 'Aktif' : 'Nonaktif'}
                </button>

                {/* Edit & Delete Action Panel */}
                <div className="flex gap-1.5 pt-1.5">
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-2 rounded-xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer border border-zinc-100 dark:border-zinc-850 transition-colors"
                    title="Ubah Detail"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(user)}
                    className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-500 hover:text-red-600 cursor-pointer border border-red-100/50 dark:border-red-900/30 transition-colors"
                    title="Hapus Karyawan"
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
                {editingUser ? 'Perbarui Karyawan' : 'Daftarkan Karyawan Baru'}
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
                label="EMPLOYEE NUMBER (DARWINBOX)"
                placeholder="Contoh: 0326056"
                value={formEmployeeNo}
                onChange={(e) => setFormEmployeeNo(e.target.value)}
                required
              />

              <Input
                label="NAMA LENGKAP KARYAWAN"
                placeholder="Contoh: RADITYA FIRMAN SYAPUTRA"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />

              <Input
                label="ALAMAT EMAIL RESMI"
                placeholder="Contoh: xxx@perumbulog.onmicrosoft.com"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />

              <div className="grid grid-cols-2 gap-3.5">
                <Input
                  label="DEPARTEMEN / UNIT"
                  placeholder="Contoh: TI"
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                />
                <Input
                  label="JABATAN"
                  placeholder="Contoh: Developer"
                  value={formDesignation}
                  onChange={(e) => setFormDesignation(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Peran / Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full text-xs font-bold rounded-2xl border py-3.5 px-3.5 focus:outline-none focus:ring-2 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 focus:border-blue-500 focus:ring-blue-500/20 cursor-pointer font-bold"
                >
                  <option value="EMPLOYEE">EMPLOYEE</option>
                  <option value="SUPERVISOR">SUPERVISOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="formIsActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 border border-zinc-200 rounded text-blue-600 focus:ring-blue-500/20"
                />
                <label htmlFor="formIsActive" className="text-xs font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer">
                  Karyawan ini Aktif (Bisa Mengakses Aplikasi)
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

export default AdminUsers;
