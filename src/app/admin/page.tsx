'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  Users,
  Cpu,
  FileSpreadsheet,
  ShieldCheck,
  Settings,
  LogOut,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  AlertTriangle,
  Download,
  Search,
  RefreshCw,
  Clock,
  KeyRound,
  Eye,
  CheckSquare,
  Square,
  ArrowRight,
  UploadCloud,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Navigation
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'events' | 'classes' | 'students' | 'generator' | 'recap' | 'supervisors' | 'settings'
  >('dashboard');

  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Stats
  const [stats, setStats] = useState<any>({
    totalEvents: 0,
    totalClasses: 0,
    totalStudents: 0,
    totalSlots: 0,
    slotsFilled: 0,
    slotsAvailable: 0,
    totalBookings: 0,
    fillPercentage: 0,
  });

  // Global / active entities
  const [events, setEvents] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [recapData, setRecapData] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<any[]>([]);
  const [appSetting, setAppSetting] = useState<any>({
    title: 'Jadwal Pengambilan Rapor',
    subtitle: 'Silakan pilih jadwal pengambilan rapor Ananda',
    logo: '/mumtaz.png',
  });

  // Notifications
  const [alertNotice, setAlertNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters for Recap
  const [recapClassFilter, setRecapClassFilter] = useState('');
  const [recapSearch, setRecapSearch] = useState('');
  const [recapStatusFilter, setRecapStatusFilter] = useState('ALL');

  // Generator State
  const [genClassId, setGenClassId] = useState('');
  const [genDuration, setGenDuration] = useState(15);
  const [genStudentCount, setGenStudentCount] = useState<number | ''>('');
  const [genPreview, setGenPreview] = useState<any>(null);
  const [genLoading, setGenLoading] = useState(false);

  // Delete Single Booking Modal
  const [singleDeleteTarget, setSingleDeleteTarget] = useState<any>(null);
  const [deletingSingle, setDeletingSingle] = useState(false);

  // Delete ALL Bookings Modal with Password
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  // Student Bulk Import Modal
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkClassId, setBulkClassId] = useState('');
  const [bulkNamesText, setBulkNamesText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  // Class Add/Edit State
  const [newClassName, setNewClassName] = useState('');

  // Student Add State
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClassId, setNewStudentClassId] = useState('');

  // Event Add State
  const [newEventName, setNewEventName] = useState('');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventDuration, setNewEventDuration] = useState(15);

  // 1. Initial Auth Check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (!json.success || json.user.role !== 'ADMIN') {
          router.push('/admin/login');
          return;
        }
        setCurrentUser(json.user);
        loadAllData();
      } catch (err) {
        router.push('/admin/login');
      }
    };
    checkAuth();
  }, [router]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setAlertNotice({ type, message });
    setTimeout(() => {
      setAlertNotice(null);
    }, 5000);
  };

  // 2. Load all system data
  const loadAllData = async () => {
    try {
      setLoading(true);

      // Load Stats
      const resStats = await fetch('/api/admin/stats');
      const jsonStats = await resStats.json();
      if (jsonStats.success) {
        setStats(jsonStats.stats);
        setActiveEvent(jsonStats.activeEvent);
      }

      // Load Events
      const resEvents = await fetch('/api/admin/events');
      const jsonEvents = await resEvents.json();
      if (jsonEvents.success) setEvents(jsonEvents.data || []);

      // Load Classes
      const resClasses = await fetch('/api/admin/classes');
      const jsonClasses = await resClasses.json();
      if (jsonClasses.success) setClasses(jsonClasses.data || []);

      // Load Supervisors
      const resSup = await fetch('/api/admin/supervisors');
      const jsonSup = await resSup.json();
      if (jsonSup.success) setSupervisors(jsonSup.data || []);

      // Load Settings
      const resSet = await fetch('/api/admin/settings');
      const jsonSet = await resSet.json();
      if (jsonSet.success) setAppSetting(jsonSet.data);

      // Load Recap
      fetchRecapData();

      // Load Students
      fetchStudentsData();
    } catch (e) {
      console.error('Error loading data', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsData = async (classId?: string) => {
    try {
      let url = '/api/admin/students';
      if (classId) url += `?classId=${classId}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setStudents(json.data || []);
    } catch (e) {
      console.error('Error fetching students', e);
    }
  };

  const fetchRecapData = async () => {
    try {
      let url = `/api/admin/recap?`;
      if (recapClassFilter) url += `&classId=${recapClassFilter}`;
      if (recapSearch) url += `&search=${encodeURIComponent(recapSearch)}`;
      if (recapStatusFilter !== 'ALL') url += `&status=${recapStatusFilter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) setRecapData(json.data || []);
    } catch (e) {
      console.error('Error fetching recap data', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'recap') {
      fetchRecapData();
    }
  }, [recapClassFilter, recapSearch, recapStatusFilter, activeTab]);

  // Handle Add Class
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    try {
      const res = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName.trim() }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', `Kelas "${newClassName}" berhasil ditambahkan.`);
        setNewClassName('');
        loadAllData();
      } else {
        showNotification('error', json.message || 'Gagal menambahkan kelas');
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Handle Delete Class
  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Hapus kelas "${name}" beserta seluruh data siswa dan slot di dalamnya?`)) return;
    try {
      const res = await fetch(`/api/admin/classes?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showNotification('success', `Kelas "${name}" berhasil dihapus.`);
        loadAllData();
      } else {
        showNotification('error', json.message);
      }
    } catch (e: any) {
      showNotification('error', e.message);
    }
  };

  // Handle Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim() || !newStudentClassId) return;
    try {
      const res = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStudentName.trim(), classId: newStudentClassId }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', `Siswa "${newStudentName}" berhasil ditambahkan.`);
        setNewStudentName('');
        fetchStudentsData();
        loadAllData();
      } else {
        showNotification('error', json.message);
      }
    } catch (e: any) {
      showNotification('error', e.message);
    }
  };

  // Handle Bulk Import Students
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkClassId || !bulkNamesText.trim()) return;
    try {
      setBulkLoading(true);
      const res = await fetch('/api/admin/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: bulkClassId, namesText: bulkNamesText }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', json.message);
        setShowBulkModal(false);
        setBulkNamesText('');
        fetchStudentsData();
        loadAllData();
      } else {
        showNotification('error', json.message);
      }
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  // Handle Delete Student
  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Hapus siswa "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/students?id=${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showNotification('success', `Siswa "${name}" berhasil dihapus.`);
        fetchStudentsData();
        loadAllData();
      } else {
        showNotification('error', json.message);
      }
    } catch (e: any) {
      showNotification('error', e.message);
    }
  };

  // Handle Generator Preview
  const handleGeneratePreview = async () => {
    if (!genClassId || !activeEvent) {
      showNotification('error', 'Pilih kelas dan pastikan event aktif tersedia.');
      return;
    }
    try {
      setGenLoading(true);
      const res = await fetch('/api/admin/slots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeEvent.id,
          classId: genClassId,
          durationMinutes: Number(genDuration),
          studentCount: genStudentCount ? Number(genStudentCount) : undefined,
          save: false,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setGenPreview(json);
      } else {
        showNotification('error', json.message);
      }
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setGenLoading(false);
    }
  };

  // Handle Generator Save to Database
  const handleSaveGeneratedSlots = async (overwrite: boolean = false) => {
    if (!genClassId || !activeEvent) return;
    try {
      setGenLoading(true);
      const res = await fetch('/api/admin/slots/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeEvent.id,
          classId: genClassId,
          durationMinutes: Number(genDuration),
          studentCount: genStudentCount ? Number(genStudentCount) : undefined,
          save: true,
          overwrite,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', json.message);
        setGenPreview(null);
        loadAllData();
      } else {
        showNotification('error', json.message);
      }
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setGenLoading(false);
    }
  };

  // Handle Delete Single Booking (Section 23)
  const handleConfirmSingleDelete = async () => {
    if (!singleDeleteTarget) return;
    try {
      setDeletingSingle(true);
      const res = await fetch('/api/admin/bookings/delete-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: singleDeleteTarget.bookingId }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', json.message);
        setSingleDeleteTarget(null);
        fetchRecapData();
        loadAllData();
      } else {
        showNotification('error', json.message);
      }
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setDeletingSingle(false);
    }
  };

  // Handle Delete ALL Bookings with Admin Password (Section 24)
  const handleConfirmDeleteAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEvent || !adminPasswordInput) {
      showNotification('error', 'Masukkan password Admin untuk konfirmasi.');
      return;
    }

    try {
      setDeletingAll(true);
      const res = await fetch('/api/admin/bookings/delete-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeEvent.id,
          password: adminPasswordInput,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', json.message);
        setShowDeleteAllModal(false);
        setAdminPasswordInput('');
        fetchRecapData();
        loadAllData();
      } else {
        showNotification('error', json.message);
      }
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setDeletingAll(false);
    }
  };

  // Handle App Settings Save (Subtitle)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: appSetting.title,
          subtitle: appSetting.subtitle,
          logo: appSetting.logo,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', 'Pengaturan aplikasi dan subjudul berhasil disimpan.');
      } else {
        showNotification('error', json.message);
      }
    } catch (e: any) {
      showNotification('error', e.message);
    }
  };

  // Handle Toggle Supervisor Active
  const handleToggleSupervisorActive = async (supId: string, currentActive: boolean) => {
    try {
      const res = await fetch('/api/admin/supervisors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supervisorId: supId,
          active: !currentActive,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', 'Status pengawas berhasil diperbarui.');
        loadAllData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR NAVIGATION (Section 17) */}
      <aside className="w-full md:w-64 bg-navy-950 text-white flex-shrink-0 flex flex-col border-r-2 border-gold-500/40">
        {/* Brand */}
        <div className="p-4 border-b border-navy-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full p-0.5 shadow flex-shrink-0">
            <Image
              src="/mumtaz.png"
              alt="Logo Mumtaz"
              width={40}
              height={40}
              className="w-full h-full object-contain rounded-full"
            />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight">Sekolah Mumtaz</h1>
            <p className="text-[10px] text-gold-400 font-bold uppercase tracking-wider">Dashboard Admin</p>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'events', label: 'Pengaturan Jadwal', icon: Calendar },
            { id: 'classes', label: 'Kelas', icon: GraduationCap },
            { id: 'students', label: 'Siswa', icon: Users },
            { id: 'generator', label: 'Generator Jadwal', icon: Cpu },
            { id: 'recap', label: 'Rekap Pengambilan Rapor', icon: FileSpreadsheet },
            { id: 'supervisors', label: 'Pengaturan Pengawas', icon: ShieldCheck },
            { id: 'settings', label: 'Pengaturan Aplikasi', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                  isActive
                    ? 'bg-navy-800 text-gold-400 border border-gold-500/40 shadow-sm'
                    : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-gold-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* User Footer & Logout */}
        <div className="p-3 border-t border-navy-900 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <div className="w-7 h-7 rounded-full bg-gold-500 text-navy-950 font-black text-xs flex items-center justify-center">
              A
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">{currentUser?.name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-navy-900 hover:bg-rose-900 text-slate-300 hover:text-rose-200 transition"
            title="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-navy-950 capitalize">
              {activeTab === 'dashboard' && 'Statistik & Ringkasan'}
              {activeTab === 'events' && 'Pengaturan Event & Periode'}
              {activeTab === 'classes' && 'Manajemen Kelas'}
              {activeTab === 'students' && 'Manajemen Data Siswa'}
              {activeTab === 'generator' && 'Generator Slot Jadwal'}
              {activeTab === 'recap' && 'Rekap Pengambilan Rapor'}
              {activeTab === 'supervisors' && 'Manajemen Akun Pengawas'}
              {activeTab === 'settings' && 'Pengaturan Aplikasi & Subjudul'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition"
            >
              <Eye className="w-3.5 h-3.5 text-navy-800" />
              <span>Lihat Web Orang Tua</span>
            </Link>
            <button
              onClick={loadAllData}
              className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-600 transition"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Global Toast Alert */}
        {alertNotice && (
          <div className="px-6 pt-4">
            <div
              className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-bold shadow-sm ${
                alertNotice.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {alertNotice.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>{alertNotice.message}</span>
              </div>
              <button onClick={() => setAlertNotice(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* TAB 1: DASHBOARD STATS (Section 18) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Event Info Card */}
              <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-800 text-white rounded-2xl p-6 shadow-md border-b-4 border-gold-500 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 bg-navy-800 px-2.5 py-1 rounded-full border border-gold-500/30">
                    Periode Rapor Aktif
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black mt-2 text-white">
                    {activeEvent ? activeEvent.name : 'Belum Ada Event Aktif'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Tanggal: {activeEvent?.date || '-'} • Jam Mulai: {activeEvent?.startTime || '08:00'} WIB • Istirahat: 11:45–13:00 WIB
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('events')}
                  className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs shadow transition flex items-center gap-1.5"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Atur Event</span>
                </button>
              </div>

              {/* Grid 8 Cards Statistik (Section 18) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold">Total Event/Periode</p>
                  <p className="text-2xl font-black text-navy-950 mt-1">{stats.totalEvents}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold">Total Kelas</p>
                  <p className="text-2xl font-black text-navy-950 mt-1">{stats.totalClasses}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold">Total Siswa</p>
                  <p className="text-2xl font-black text-navy-950 mt-1">{stats.totalStudents}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold">Total Slot Waktu</p>
                  <p className="text-2xl font-black text-navy-950 mt-1">{stats.totalSlots}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold">Slot Sudah Terisi</p>
                  <p className="text-2xl font-black text-emerald-600 mt-1">{stats.slotsFilled}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold">Slot Masih Tersedia</p>
                  <p className="text-2xl font-black text-blue-600 mt-1">{stats.slotsAvailable}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold">Total Booking</p>
                  <p className="text-2xl font-black text-purple-600 mt-1">{stats.totalBookings}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 font-semibold">Persentase Terisi</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-black text-gold-600">{stats.fillPercentage}%</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-navy-800" />
                    <span>Generator Slot</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Otomatis buat slot jadwal kelas dengan melompati waktu istirahat 11.45–13.00.
                  </p>
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="w-full py-2 bg-navy-900 hover:bg-navy-950 text-gold-400 font-bold text-xs rounded-lg transition"
                  >
                    Buka Generator Jadwal
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Rekap & Unduh CSV</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Lihat seluruh status kehadiran orang tua atau ekspor rekap ke format CSV/Excel.
                  </p>
                  <button
                    onClick={() => setActiveTab('recap')}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition"
                  >
                    Buka Rekap Rapor
                  </button>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <h4 className="font-bold text-sm text-navy-950 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>6 Akun Pengawas</span>
                  </h4>
                  <p className="text-xs text-slate-500">
                    Kelola akun pengawas lapangan dan atur penugasan kelas yang diawasi.
                  </p>
                  <button
                    onClick={() => setActiveTab('supervisors')}
                    className="w-full py-2 bg-navy-800 hover:bg-navy-700 text-gold-400 font-bold text-xs rounded-lg transition"
                  >
                    Kelola Pengawas
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PENGATURAN JADWAL & EVENTS (Section 19 & 38) */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {/* Form Tambah Event */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-navy-950">Tambah Periode / Event Pengambilan Rapor</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newEventName || !newEventDate) return;
                    const res = await fetch('/api/admin/events', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: newEventName,
                        date: newEventDate,
                        durationMinutes: newEventDuration,
                        active: true,
                      }),
                    });
                    const json = await res.json();
                    if (json.success) {
                      showNotification('success', `Event "${newEventName}" berhasil dibuat dan diaktifkan.`);
                      setNewEventName('');
                      setNewEventDate('');
                      loadAllData();
                    }
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-3"
                >
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Event / Periode</label>
                    <input
                      type="text"
                      placeholder="Contoh: Pengambilan Rapor Semester Ganjil TP 2026/2027"
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
                    <input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Durasi Default</label>
                    <select
                      value={newEventDuration}
                      onChange={(e) => setNewEventDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value={10}>10 Menit</option>
                      <option value={15}>15 Menit</option>
                      <option value={20}>20 Menit</option>
                    </select>
                  </div>
                  <div className="md:col-span-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-navy-900 hover:bg-navy-950 text-gold-400 font-bold text-xs rounded-lg transition"
                    >
                      + Tambah & Aktifkan Event
                    </button>
                  </div>
                </form>
              </div>

              {/* Daftar Events */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">Daftar Event / Periode</h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {events.map((ev) => (
                    <div key={ev.id} className="p-4 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-sm text-navy-950">{ev.name}</h5>
                          {ev.active && (
                            <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                              AKTIF
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Tanggal: {ev.date} • Durasi: {ev.durationMinutes} menit • Total Slot: {ev._count?.slots || 0} • Booked: {ev._count?.bookings || 0}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {!ev.active && (
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/events', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: ev.id, active: true }),
                              });
                              loadAllData();
                            }}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 rounded-lg transition"
                          >
                            Set Aktif
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (!confirm(`Hapus event "${ev.name}" beserta seluruh slot dan booking di dalamnya?`)) return;
                            await fetch(`/api/admin/events?id=${ev.id}`, { method: 'DELETE' });
                            loadAllData();
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Hapus Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MANAJEMEN KELAS (Section 20) */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              {/* Tambah Kelas Form */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="w-full sm:w-auto">
                  <h3 className="text-sm font-bold text-navy-950">Tambah Kelas Baru</h3>
                  <p className="text-xs text-slate-500">Contoh: VII A, VII B, X, XI, XII</p>
                </div>
                <form onSubmit={handleAddClass} className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Nama kelas (misal: IX A)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs w-48"
                    required
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-900 hover:bg-navy-950 text-gold-400 font-bold text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </form>
              </div>

              {/* Tabel Kelas */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                      <th className="py-3 px-4">Nama Kelas</th>
                      <th className="py-3 px-4 text-center">Jumlah Siswa</th>
                      <th className="py-3 px-4 text-center">Slot Waktu</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classes.map((cls) => (
                      <tr key={cls.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-navy-950 text-sm">{cls.name}</td>
                        <td className="py-3 px-4 text-center font-bold text-slate-700">{cls._count?.students || 0}</td>
                        <td className="py-3 px-4 text-center text-slate-600">{cls._count?.slots || 0}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={async () => {
                              await fetch('/api/admin/classes', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ id: cls.id, active: !cls.active }),
                              });
                              loadAllData();
                            }}
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              cls.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {cls.active ? 'Aktif' : 'Nonaktif'}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteClass(cls.id, cls.name)}
                            className="p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                            title="Hapus Kelas"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MANAJEMEN SISWA (Section 13 & 21) */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Header Action: Add Student & Bulk Import */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Single Student Form */}
                <form onSubmit={handleAddStudent} className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <input
                    type="text"
                    placeholder="Nama lengkap siswa"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs w-48"
                    required
                  />
                  <select
                    value={newStudentClassId}
                    onChange={(e) => setNewStudentClassId(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    required
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-navy-900 hover:bg-navy-950 text-gold-400 font-bold text-xs rounded-lg transition flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Siswa</span>
                  </button>
                </form>

                {/* Bulk Import Button */}
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Bulk Import (Satu Nama Per Baris)</span>
                </button>
              </div>

              {/* Tabel Siswa */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Total {students.length} Siswa Terdaftar</span>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase">
                      <tr>
                        <th className="py-2.5 px-4 w-12">No</th>
                        <th className="py-2.5 px-4">Nama Siswa</th>
                        <th className="py-2.5 px-4 w-32">Kelas</th>
                        <th className="py-2.5 px-4 w-40 text-center">Status Jadwal</th>
                        <th className="py-2.5 px-4 w-20 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((s, idx) => {
                        const hasBooking = s.bookings && s.bookings.length > 0;
                        return (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-4 text-slate-400">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-bold text-navy-950">{s.name}</td>
                            <td className="py-2.5 px-4 text-slate-600 font-medium">{s.class?.name}</td>
                            <td className="py-2.5 px-4 text-center">
                              {hasBooking ? (
                                <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                                  Sudah Ambil Jadwal
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[11px]">
                                  Belum Ambil
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                onClick={() => handleDeleteStudent(s.id, s.name)}
                                className="p-1 text-rose-500 hover:bg-rose-50 rounded transition"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GENERATOR JADWAL (Section 11, 12, 22, 41) */}
          {activeTab === 'generator' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-navy-950">Generator Otomatis Slot Pengambilan Rapor</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Aturan otomatis: Mulai pukul 08.00 WIB. Waktu istirahat 11.45–13.00 WIB dilewati secara otomatis tanpa bertabrakan.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-navy-950 mb-1">Pilih Kelas</label>
                    <select
                      value={genClassId}
                      onChange={(e) => {
                        setGenClassId(e.target.value);
                        setGenPreview(null);
                        const c = classes.find((cl) => cl.id === e.target.value);
                        if (c) setGenStudentCount(c._count?.students || 0);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c._count?.students || 0} siswa)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-950 mb-1">Durasi Tiap Slot</label>
                    <select
                      value={genDuration}
                      onChange={(e) => {
                        setGenDuration(Number(e.target.value));
                        setGenPreview(null);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    >
                      <option value={10}>10 Menit per Siswa</option>
                      <option value={15}>15 Menit per Siswa (Default)</option>
                      <option value={20}>20 Menit per Siswa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-navy-950 mb-1">Jumlah Slot (Siswa)</label>
                    <input
                      type="number"
                      placeholder="Otomatis dari siswa kelas"
                      value={genStudentCount}
                      onChange={(e) => {
                        setGenStudentCount(Number(e.target.value));
                        setGenPreview(null);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    disabled={genLoading || !genClassId}
                    onClick={handleGeneratePreview}
                    className="px-5 py-2.5 bg-navy-900 hover:bg-navy-950 text-gold-400 font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Lihat Preview Slot</span>
                  </button>
                </div>
              </div>

              {/* Preview Hasil Generator */}
              {genPreview && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm space-y-4 p-6 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-navy-950">
                        Hasil Generator: {genPreview.totalSlots} Slot Jadwal
                      </h4>
                      <p className="text-xs text-slate-500">
                        Durasi: {genDuration} menit • Melompati istirahat 11.45–13.00
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={genLoading}
                      onClick={() => handleSaveGeneratedSlots(true)}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>SIMPAN & AKTIFKAN SLOT INI</span>
                    </button>
                  </div>

                  {genPreview.discrepancyWarning && (
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 font-medium">
                      ⚠️ {genPreview.discrepancyWarning}
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-2">
                    {genPreview.slots.map((s: any, idx: number) => {
                      const isAfterBreak = s.startTime >= '13:00' && (idx === 0 || genPreview.slots[idx - 1]?.startTime < '11:45');
                      return (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-0.5"
                        >
                          <span className="text-[10px] text-slate-400 font-bold">Slot {idx + 1}</span>
                          <p className="text-xs font-black text-navy-950">
                            {s.startTime}–{s.endTime}
                          </p>
                          <span className="text-[9px] text-emerald-600 font-semibold uppercase">Tersedia</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: REKAP PENGAMBILAN RAPOR (Section 23, 24, 25, 43) */}
          {activeTab === 'recap' && (
            <div className="space-y-6">
              {/* Filter and Top Action Bar */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                  {/* Filter Kelas */}
                  <select
                    value={recapClassFilter}
                    onChange={(e) => setRecapClassFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>

                  {/* Filter Status Slot */}
                  <select
                    value={recapStatusFilter}
                    onChange={(e) => setRecapStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="ALL">Semua Status</option>
                    <option value="BOOKED">Sudah Terisi (Booked)</option>
                    <option value="AVAILABLE">Masih Tersedia</option>
                  </select>

                  {/* Search nama siswa */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Cari nama siswa..."
                      value={recapSearch}
                      onChange={(e) => setRecapSearch(e.target.value)}
                      className="pl-8 pr-3 py-2 border border-slate-300 rounded-lg text-xs w-44"
                    />
                  </div>
                </div>

                {/* Actions: Export CSV & HAPUS SEMUA JADWAL */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <a
                    href={`/api/admin/export?${activeEvent ? `eventId=${activeEvent.id}` : ''}`}
                    download
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </a>

                  {/* Tombol Hapus Semua Jadwal (Section 24) */}
                  <button
                    type="button"
                    onClick={() => {
                      setAdminPasswordInput('');
                      setShowDeleteAllModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-black text-xs shadow flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>HAPUS SEMUA JADWAL</span>
                  </button>
                </div>
              </div>

              {/* Tabel Rekapan Lengkap */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">No</th>
                        <th className="py-3 px-3 w-24">Tanggal</th>
                        <th className="py-3 px-3 w-20">Kelas</th>
                        <th className="py-3 px-3">Nama Siswa</th>
                        <th className="py-3 px-3 w-28">Jam</th>
                        <th className="py-3 px-3 w-24 text-center">Status Slot</th>
                        <th className="py-3 px-3 w-28 text-center">Kehadiran</th>
                        <th className="py-3 px-3 w-28 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {recapData.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                            Tidak ada data jadwal yang sesuai dengan filter.
                          </td>
                        </tr>
                      ) : (
                        recapData.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 text-center text-slate-400">{item.no}</td>
                            <td className="py-3 px-3 text-slate-600">{item.date}</td>
                            <td className="py-3 px-3 font-semibold text-navy-900">{item.className}</td>
                            <td className="py-3 px-3 font-bold text-navy-950">{item.studentName}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.timeSlot}</td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.slotStatus === 'BOOKED'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-blue-50 text-blue-700'
                                }`}
                              >
                                {item.slotStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              {item.parentArrived ? (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  ✓ Datang
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Belum Datang</span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              {/* Hapus satu jadwal booking jika sudah terisi (Section 23) */}
                              {item.bookingId && (
                                <button
                                  type="button"
                                  onClick={() => setSingleDeleteTarget(item)}
                                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded transition"
                                >
                                  Hapus Jadwal
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PENGATURAN PENGAWAS (Section 26 & 36) */}
          {activeTab === 'supervisors' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 bg-slate-50 border-b border-slate-200">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600">
                    6 Akun Pengawas Lapangan
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pengawas bertugas memantau kehadiran orang tua dan mendengarkan alarm jadwal rapor.
                  </p>
                </div>

                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase">
                      <th className="py-3 px-4">Nama Pengawas</th>
                      <th className="py-3 px-4">Username</th>
                      <th className="py-3 px-4">Status Akun</th>
                      <th className="py-3 px-4">Kelas yang Diawasi</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {supervisors.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-navy-950 text-sm">{s.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{s.username}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              s.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {s.active ? 'Aktif' : 'Nonaktif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-700">
                          {s.assignedClasses?.length > 0 ? s.assignedClasses.join(', ') : 'Belum memilih kelas'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleToggleSupervisorActive(s.id, s.active)}
                            className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                          >
                            {s.active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: PENGATURAN APLIKASI (Section 1 & 17) */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-2xl">
                <h3 className="text-base font-bold text-navy-950">Pengaturan Identitas & Subjudul Aplikasi</h3>
                <form onSubmit={handleSaveSettings} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Judul Utama Aplikasi</label>
                    <input
                      type="text"
                      value={appSetting.title}
                      onChange={(e) => setAppSetting({ ...appSetting, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Subjudul Aplikasi (Dapat diubah oleh Admin)
                    </label>
                    <textarea
                      rows={3}
                      value={appSetting.subtitle}
                      onChange={(e) => setAppSetting({ ...appSetting, subtitle: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                      placeholder="Silakan pilih jadwal pengambilan rapor Ananda"
                      required
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Teks ini akan ditampilkan di bawah judul utama pada halaman depan orang tua.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">File Logo</label>
                    <input
                      type="text"
                      value={appSetting.logo}
                      onChange={(e) => setAppSetting({ ...appSetting, logo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-slate-50"
                      readOnly
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Menggunakan logo resmi Sekolah Islam Mumtaz (`/mumtaz.png`).
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-navy-900 hover:bg-navy-950 text-gold-400 font-bold text-xs rounded-xl shadow transition"
                    >
                      SIMPAN PENGATURAN
                    </button>
                  </div>
                </form>
              </div>

              {/* Inisialisasi Database Supabase PostgreSQL Cloud */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 max-w-2xl">
                <h3 className="text-base font-bold text-navy-950 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-navy-800" />
                  <span>Inisialisasi & Setup Database Supabase PostgreSQL</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Gunakan tombol ini setelah menghubungkan <code>DATABASE_URL</code> Supabase di Vercel atau file <code>.env</code> untuk menginisialisasi tabel dan seed data awal (Admin, 6 Pengawas, Kelas, Siswa, dan Slot Awal).
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    const pass = prompt('Masukkan Password Admin untuk inisialisasi database Supabase PostgreSQL:');
                    if (!pass) return;
                    try {
                      const res = await fetch('/api/admin/setup-db', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password: pass }),
                      });
                      const json = await res.json();
                      if (json.success) {
                        showNotification('success', json.message);
                        loadAllData();
                      } else {
                        showNotification('error', json.message);
                      }
                    } catch (e: any) {
                      showNotification('error', e.message);
                    }
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-gold-400 font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4 text-gold-400" />
                  <span>Inisialisasi / Seed Supabase Sekarang</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: HAPUS SATU JADWAL (Section 23) */}
      {singleDeleteTarget && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-navy-950">Konfirmasi Hapus Jadwal</h3>
              <p className="text-xs text-slate-600">
                Apakah Anda yakin ingin menghapus jadwal pengambilan rapor untuk{' '}
                <span className="font-bold text-navy-950">{singleDeleteTarget.studentName}</span> pada pukul{' '}
                <span className="font-bold text-navy-950">{singleDeleteTarget.timeSlot}</span>?
              </p>
              <p className="text-[11px] text-slate-500 pt-1">
                Setelah dihapus, slot waktu ini akan kembali <strong>TERSEDIA</strong> untuk orang tua lainnya.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSingleDeleteTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingSingle}
                onClick={handleConfirmSingleDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
              >
                {deletingSingle ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Hapus Jadwal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: HAPUS SEMUA JADWAL DENGAN PASSWORD (Section 24) */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-rose-500 animate-in fade-in zoom-in-95">
            <div className="bg-rose-700 text-white p-5 text-center">
              <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-rose-200" />
              <h3 className="text-base font-black uppercase tracking-wider">PERINGATAN</h3>
              <p className="text-xs text-rose-100 mt-1">
                Tindakan Berisiko Tinggi
              </p>
            </div>

            <form onSubmit={handleConfirmDeleteAll} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan menghapus <strong>seluruh jadwal/booking pengambilan rapor</strong> pada event{' '}
                <strong>{activeEvent?.name}</strong>. Semua booking akan dibatalkan dan seluruh slot akan dikembalikan menjadi tersedia.
              </p>

              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 font-medium">
                Untuk melanjutkan, Admin harus memasukkan Password Admin.
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">
                  Masukkan Password Admin
                </label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Password admin Anda"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-rose-600 focus:outline-none"
                    required
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDeleteAllModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={deletingAll || !adminPasswordInput}
                  className="px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
                >
                  {deletingAll ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Hapus Semua Jadwal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: BULK IMPORT SISWA (Section 13) */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-navy-950 text-white p-5 border-b-2 border-gold-500">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-gold-400" />
                <span>Bulk Import Nama Siswa</span>
              </h3>
              <p className="text-xs text-gold-300/80 mt-0.5">
                Masukkan daftar nama siswa dengan format satu nama per baris
              </p>
            </div>

            <form onSubmit={handleBulkImport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">Pilih Kelas Tujuan</label>
                <select
                  value={bulkClassId}
                  onChange={(e) => setBulkClassId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">
                  Daftar Nama Siswa (1 Nama Per Baris)
                </label>
                <textarea
                  rows={8}
                  placeholder={`Ahmad Fauzan\nBudi Santoso\nCandra Pratama\nDeni Kurniawan`}
                  value={bulkNamesText}
                  onChange={(e) => setBulkNamesText(e.target.value)}
                  className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-navy-800 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={bulkLoading || !bulkClassId || !bulkNamesText.trim()}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
                >
                  {bulkLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Import Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
