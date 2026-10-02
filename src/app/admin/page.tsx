'use client';

import { useState, useEffect, useMemo } from 'react';
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
  UserX,
  UserCheck,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();

  // Navigation
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'events' | 'classes' | 'students' | 'administrasi' | 'generator' | 'recap' | 'supervisors' | 'settings'
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

  // Administrasi (Hold & Unhold) State
  const [adminSubTab, setAdminSubTab] = useState<'active' | 'held'>('active');
  const [adminClassFilter, setAdminClassFilter] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [selectedAdminStudentIds, setSelectedAdminStudentIds] = useState<string[]>([]);
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [unholdModalOpen, setUnholdModalOpen] = useState(false);
  const [holdProcessing, setHoldProcessing] = useState(false);
  const [targetSingleStudent, setTargetSingleStudent] = useState<any | null>(null);

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

  // Event Edit State
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [editEventName, setEditEventName] = useState('');
  const [editEventDate, setEditEventDate] = useState('');
  const [editEventSaving, setEditEventSaving] = useState(false);

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

  // --- EDIT EVENT / PERIODE LOGIC ---
  const handleOpenEditEvent = (ev: any) => {
    setEditingEvent(ev);
    setEditEventName(ev.name);
    setEditEventDate(ev.date || '');
  };

  const handleSaveEditEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !editEventName.trim()) return;

    try {
      setEditEventSaving(true);
      const res = await fetch('/api/admin/events', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingEvent.id,
          name: editEventName.trim(),
          date: editEventDate || editingEvent.date,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showNotification('success', `Nama event/periode berhasil diperbarui menjadi "${editEventName.trim()}".`);
        setEditingEvent(null);
        await loadAllData();
      } else {
        showNotification('error', json.message || 'Gagal memperbarui event');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setEditEventSaving(false);
    }
  };

  // --- ADMINISTRASI (HOLD / UNHOLD) LOGIC ---
  const filteredAdminStudents = useMemo(() => {
    return students.filter((s) => {
      // 1. Filter sub-tab (active vs held)
      if (adminSubTab === 'active' && s.active === false) return false;
      if (adminSubTab === 'held' && s.active !== false) return false;

      // 2. Filter kelas
      if (adminClassFilter && s.classId !== adminClassFilter) return false;

      // 3. Filter search nama
      if (adminSearch && !s.name.toLowerCase().includes(adminSearch.toLowerCase())) return false;

      return true;
    });
  }, [students, adminSubTab, adminClassFilter, adminSearch]);

  const activeStudentsCount = useMemo(() => {
    return students.filter((s) => s.active !== false).length;
  }, [students]);

  const heldStudentsCount = useMemo(() => {
    return students.filter((s) => s.active === false).length;
  }, [students]);

  const handleToggleSelectAllAdmin = () => {
    const displayedIds = filteredAdminStudents.map((s) => s.id);
    const allSelected = displayedIds.length > 0 && displayedIds.every((id) => selectedAdminStudentIds.includes(id));

    if (allSelected) {
      setSelectedAdminStudentIds((prev) => prev.filter((id) => !displayedIds.includes(id)));
    } else {
      const newSet = new Set([...selectedAdminStudentIds, ...displayedIds]);
      setSelectedAdminStudentIds(Array.from(newSet));
    }
  };

  const handleToggleSelectAdminStudent = (studentId: string) => {
    setSelectedAdminStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSwitchAdminSubTab = (tab: 'active' | 'held') => {
    setAdminSubTab(tab);
    setSelectedAdminStudentIds([]);
  };

  const handleExecuteHold = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      setHoldProcessing(true);
      const res = await fetch('/api/admin/students/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: ids, hold: true }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', json.message || `Berhasil menahan ${ids.length} siswa.`);
        setSelectedAdminStudentIds([]);
        setHoldModalOpen(false);
        setTargetSingleStudent(null);
        await fetchStudentsData();
      } else {
        showNotification('error', json.message || 'Gagal menahan siswa');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setHoldProcessing(false);
    }
  };

  const handleExecuteUnhold = async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      setHoldProcessing(true);
      const res = await fetch('/api/admin/students/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: ids, hold: false }),
      });
      const json = await res.json();
      if (json.success) {
        showNotification('success', json.message || `Berhasil melepas hold ${ids.length} siswa.`);
        setSelectedAdminStudentIds([]);
        setUnholdModalOpen(false);
        setTargetSingleStudent(null);
        await fetchStudentsData();
      } else {
        showNotification('error', json.message || 'Gagal melepas hold siswa');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setHoldProcessing(false);
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
            { id: 'administrasi', label: 'Administrasi', icon: UserX },
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
              {activeTab === 'administrasi' && 'Administrasi & Status Hold Siswa'}
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
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 bg-navy-800 px-2.5 py-1 rounded-full border border-gold-500/30">
                      Periode Rapor Aktif
                    </span>
                    {activeEvent && (
                      <button
                        onClick={() => handleOpenEditEvent(activeEvent)}
                        className="text-[11px] font-bold text-gold-400 hover:text-gold-300 underline flex items-center gap-1 transition"
                        title="Edit Nama Periode Aktif"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Edit Nama</span>
                      </button>
                    )}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black mt-2 text-white flex items-center gap-2">
                    <span>{activeEvent ? activeEvent.name : 'Belum Ada Event Aktif'}</span>
                    {activeEvent && (
                      <button
                        onClick={() => handleOpenEditEvent(activeEvent)}
                        className="p-1 rounded-lg bg-navy-800 hover:bg-navy-700 text-gold-400 border border-gold-500/30 transition text-xs"
                        title="Edit Nama Event"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Tanggal: {activeEvent?.date || '-'} • Jam Mulai: {activeEvent?.startTime || '08:00'} WIB • Istirahat: 11:45–13:00 WIB
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {activeEvent && (
                    <button
                      onClick={() => handleOpenEditEvent(activeEvent)}
                      className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-gold-400 font-bold text-xs border border-gold-500/40 shadow transition flex items-center gap-1.5"
                      title="Edit Nama Periode Aktif"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Nama Periode</span>
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('events')}
                    className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold text-xs shadow transition flex items-center gap-1.5"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Atur Event</span>
                  </button>
                </div>
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
                        <button
                          onClick={() => handleOpenEditEvent(ev)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition flex items-center gap-1"
                          title="Edit Nama Event"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>
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

          {/* TAB: ADMINISTRASI & HOLD/UNHOLD SISWA */}
          {activeTab === 'administrasi' && (
            <div className="space-y-6">
              {/* Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-900 text-gold-400 flex items-center justify-center flex-shrink-0 shadow">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-navy-950">
                        Administrasi & Pengendalian Akses Siswa
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tahan (Hold) siswa yang belum menyelesaikan administrasi agar namanya tidak tampil di halaman utama, atau lepaskan (Unhold) agar dapat memilih jadwal kembali.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ringkasan Statistik Siswa */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Siswa</p>
                      <p className="text-xl font-black text-navy-950 mt-0.5">{students.length}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-navy-100 text-navy-900 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Siswa Aktif (Tampil di Web)</p>
                      <p className="text-xl font-black text-emerald-900 mt-0.5">{activeStudentsCount}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                      <UserCheck className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="bg-rose-50/60 border border-rose-200/80 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Siswa Di-Hold (Ditahan)</p>
                      <p className="text-xl font-black text-rose-900 mt-0.5">{heldStudentsCount}</p>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center">
                      <UserX className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter, Search & Sub-Tabs */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Sub-Tabs: Siswa Aktif vs Siswa di-Hold */}
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => handleSwitchAdminSubTab('active')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                        adminSubTab === 'active'
                          ? 'bg-navy-900 text-gold-400 shadow-sm'
                          : 'text-slate-600 hover:text-navy-950'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Daftar Siswa Aktif</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          adminSubTab === 'active' ? 'bg-gold-500 text-navy-950' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {activeStudentsCount}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSwitchAdminSubTab('held')}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                        adminSubTab === 'held'
                          ? 'bg-rose-700 text-white shadow-sm'
                          : 'text-slate-600 hover:text-navy-950'
                      }`}
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>Daftar Siswa di-Hold</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                          adminSubTab === 'held' ? 'bg-white text-rose-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {heldStudentsCount}
                      </span>
                    </button>
                  </div>

                  {/* Filter Kelas & Search Nama */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Filter Kelas */}
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={adminClassFilter}
                        onChange={(e) => {
                          setAdminClassFilter(e.target.value);
                          setSelectedAdminStudentIds([]);
                        }}
                        className="bg-transparent text-xs font-medium text-slate-700 focus:outline-none"
                      >
                        <option value="">Semua Kelas</option>
                        {classes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Search Nama Siswa */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama siswa..."
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-48 sm:w-56 focus:outline-none focus:ring-1 focus:ring-navy-900"
                      />
                    </div>
                  </div>
                </div>

                {/* Bulk Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 bg-slate-50/80 -mx-5 -mb-5 p-4 rounded-b-2xl">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-700">
                      {filteredAdminStudents.length} siswa ditampilkan
                    </span>
                    {selectedAdminStudentIds.length > 0 && (
                      <span className="bg-navy-900 text-gold-400 font-bold px-2.5 py-0.5 rounded-full text-[11px]">
                        {selectedAdminStudentIds.length} siswa dipilih
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {adminSubTab === 'active' ? (
                      <button
                        type="button"
                        disabled={selectedAdminStudentIds.length === 0}
                        onClick={() => {
                          setTargetSingleStudent(null);
                          setHoldModalOpen(true);
                        }}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        <PauseCircle className="w-4 h-4" />
                        <span>Hold Siswa Terpilih ({selectedAdminStudentIds.length})</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={selectedAdminStudentIds.length === 0}
                        onClick={() => {
                          setTargetSingleStudent(null);
                          setUnholdModalOpen(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5"
                      >
                        <PlayCircle className="w-4 h-4" />
                        <span>Unhold Siswa Terpilih ({selectedAdminStudentIds.length})</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Table of Students */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[550px]">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 z-10">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={
                              filteredAdminStudents.length > 0 &&
                              filteredAdminStudents.every((s) => selectedAdminStudentIds.includes(s.id))
                            }
                            onChange={handleToggleSelectAllAdmin}
                            className="w-4 h-4 rounded text-navy-900 focus:ring-navy-800 cursor-pointer"
                            title="Pilih Semua Siswa di Halaman Ini"
                          />
                        </th>
                        <th className="py-3 px-3 w-12 text-slate-500">No</th>
                        <th className="py-3 px-4">Nama Siswa</th>
                        <th className="py-3 px-4 w-40">Kelas</th>
                        <th className="py-3 px-4 w-40 text-center">Status Jadwal</th>
                        <th className="py-3 px-4 w-44 text-center">Status Akses Web</th>
                        <th className="py-3 px-4 w-28 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredAdminStudents.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500">
                            {adminSubTab === 'held' ? (
                              <div className="flex flex-col items-center justify-center gap-2">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                  <CheckCircle className="w-6 h-6" />
                                </div>
                                <p className="font-bold text-slate-700 text-sm">Tidak ada siswa yang sedang di-Hold</p>
                                <p className="text-xs text-slate-400 max-w-sm">
                                  Semua siswa aktif dan dapat memilih jadwal pengambilan rapor di halaman utama.
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center gap-2">
                                <Users className="w-8 h-8 text-slate-300" />
                                <p className="font-semibold text-slate-600">Tidak ada data siswa yang cocok dengan filter</p>
                              </div>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredAdminStudents.map((s, idx) => {
                          const isSelected = selectedAdminStudentIds.includes(s.id);
                          const isHeld = s.active === false;
                          const hasBooking = s.bookings && s.bookings.length > 0;

                          return (
                            <tr
                              key={s.id}
                              className={`transition-colors ${
                                isSelected ? 'bg-gold-50/60' : 'hover:bg-slate-50'
                              }`}
                            >
                              <td className="py-2.5 px-4 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectAdminStudent(s.id)}
                                  className="w-4 h-4 rounded text-navy-900 focus:ring-navy-800 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-4 font-bold text-navy-950">
                                <span>{s.name}</span>
                              </td>
                              <td className="py-2.5 px-4 text-slate-600 font-semibold">
                                {s.class?.name}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {hasBooking ? (
                                  <span className="bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                                    Sudah Booking
                                  </span>
                                ) : (
                                  <span className="bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full text-[11px]">
                                    Belum Booking
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {isHeld ? (
                                  <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-rose-200">
                                    <PauseCircle className="w-3 h-3" />
                                    <span>Di-Hold (Tidak Tampil)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
                                    <CheckCircle className="w-3 h-3" />
                                    <span>Aktif (Tampil di Web)</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-4 text-center">
                                {isHeld ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetSingleStudent(s);
                                      setUnholdModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1"
                                    title="Lepas Hold (Unhold)"
                                  >
                                    <PlayCircle className="w-3 h-3" />
                                    <span>Unhold</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetSingleStudent(s);
                                      setHoldModalOpen(true);
                                    }}
                                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition inline-flex items-center gap-1"
                                    title="Tahan Siswa (Hold)"
                                  >
                                    <PauseCircle className="w-3 h-3" />
                                    <span>Hold</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
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

      {/* MODAL 4: KONFIRMASI HOLD SISWA */}
      {holdModalOpen && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-rose-950 text-white p-5 border-b-2 border-rose-500">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserX className="w-5 h-5 text-rose-400" />
                <span>Konfirmasi Hold Siswa</span>
              </h3>
              <p className="text-xs text-rose-300 mt-0.5">
                Menahan akses pemilihan jadwal pengambilan rapor
              </p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan menahan (Hold){' '}
                <strong>
                  {targetSingleStudent
                    ? `1 siswa (${targetSingleStudent.name})`
                    : `${selectedAdminStudentIds.length} siswa`}
                </strong>
                .
              </p>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>Dampak Penahanan (Hold):</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-rose-700 pl-1 space-y-0.5">
                  <li>Nama siswa <strong>tidak akan muncul</strong> pada pilihan nama di web utama orang tua.</li>
                  <li>Orang tua tidak dapat memesan jadwal untuk siswa yang di-Hold.</li>
                  <li>Status dapat dikembalikan sewaktu-waktu di menu Unhold.</li>
                </ul>
              </div>

              {/* Daftar Siswa yang akan di-Hold */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Daftar Siswa yang Ditahan:
                </p>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {(targetSingleStudent
                    ? [targetSingleStudent]
                    : students.filter((s) => selectedAdminStudentIds.includes(s.id))
                  ).map((st) => (
                    <div
                      key={st.id}
                      className="text-xs flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200"
                    >
                      <span className="font-bold text-navy-950">{st.name}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        {st.class?.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={holdProcessing}
                  onClick={() => {
                    setHoldModalOpen(false);
                    setTargetSingleStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={holdProcessing}
                  onClick={() => {
                    const idsToHold = targetSingleStudent
                      ? [targetSingleStudent.id]
                      : selectedAdminStudentIds;
                    handleExecuteHold(idsToHold);
                  }}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
                >
                  {holdProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserX className="w-3.5 h-3.5" />
                  )}
                  <span>Ya, Tahan (Hold) Siswa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: KONFIRMASI UNHOLD SISWA */}
      {unholdModalOpen && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-emerald-950 text-white p-5 border-b-2 border-emerald-500">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <span>Konfirmasi Unhold Siswa</span>
              </h3>
              <p className="text-xs text-emerald-300 mt-0.5">
                Mengembalikan akses pemilihan jadwal pengambilan rapor
              </p>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Anda akan mengaktifkan kembali (Unhold){' '}
                <strong>
                  {targetSingleStudent
                    ? `1 siswa (${targetSingleStudent.name})`
                    : `${selectedAdminStudentIds.length} siswa`}
                </strong>
                .
              </p>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Dampak Pembukaan (Unhold):</span>
                </p>
                <ul className="list-disc list-inside text-[11px] text-emerald-700 pl-1 space-y-0.5">
                  <li>Nama siswa akan <strong>langsung muncul kembali</strong> di halaman utama web orang tua.</li>
                  <li>Orang tua dapat memilih dan memesan jadwal rapor secara normal.</li>
                </ul>
              </div>

              {/* Daftar Siswa yang akan di-Unhold */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  Daftar Siswa yang Dibuka (Unhold):
                </p>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1 bg-slate-50">
                  {(targetSingleStudent
                    ? [targetSingleStudent]
                    : students.filter((s) => selectedAdminStudentIds.includes(s.id))
                  ).map((st) => (
                    <div
                      key={st.id}
                      className="text-xs flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200"
                    >
                      <span className="font-bold text-navy-950">{st.name}</span>
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                        {st.class?.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={holdProcessing}
                  onClick={() => {
                    setUnholdModalOpen(false);
                    setTargetSingleStudent(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={holdProcessing}
                  onClick={() => {
                    const idsToUnhold = targetSingleStudent
                      ? [targetSingleStudent.id]
                      : selectedAdminStudentIds;
                    handleExecuteUnhold(idsToUnhold);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
                >
                  {holdProcessing ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Ya, Buka (Unhold) Siswa</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT NAMA EVENT / PERIODE */}
      {editingEvent && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-navy-950 text-white p-5 border-b-2 border-gold-500">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-gold-400" />
                <span>Edit Nama Event / Periode</span>
              </h3>
              <p className="text-xs text-gold-300 mt-0.5">
                {editingEvent.active
                  ? 'Periode ini sedang AKTIF di web orang tua'
                  : 'Periode nonaktif'}
              </p>
            </div>

            <form onSubmit={handleSaveEditEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">
                  Nama Event / Periode <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editEventName}
                  onChange={(e) => setEditEventName(e.target.value)}
                  placeholder="Contoh: Pengambilan Rapor Semester Ganjil TP 2026/2027"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none font-medium"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Nama ini akan langsung tampil di halaman depan untuk orang tua, dashboard pengawas, dan rekapan rapor.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-navy-950 mb-1">
                  Tanggal Pelaksanaan
                </label>
                <input
                  type="date"
                  value={editEventDate}
                  onChange={(e) => setEditEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-navy-900 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={editEventSaving}
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={editEventSaving || !editEventName.trim()}
                  className="px-5 py-2 bg-navy-900 hover:bg-navy-950 disabled:bg-slate-300 text-gold-400 font-bold text-xs rounded-lg shadow transition flex items-center gap-1.5"
                >
                  {editEventSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
