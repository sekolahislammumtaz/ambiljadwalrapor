'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  BellOff,
  BellRing,
  Volume2,
  CheckCircle,
  Clock,
  Shield,
  Layers,
  LogOut,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  CheckSquare,
  Square,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { bellManager } from '@/lib/audio';

interface BookingRecord {
  id: string;
  slotId: string;
  studentName: string;
  className: string;
  classId: string;
  startTime: string;
  endTime: string;
  timeSlot: string;
  parentArrived: boolean;
  status: 'BELUM_DATANG' | 'MENUNGGU' | 'SEDANG_DILAYANI' | 'SELESAI' | 'TERLAMBAT';
  arrivedAt: string | null;
  servedAt: string | null;
  completedAt: string | null;
}

interface GroupedClass {
  classId: string;
  className: string;
  bookings: BookingRecord[];
}

export default function PengawasDashboardPage() {
  const router = useRouter();

  // User & Auth
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active Event & Classes
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [allClasses, setAllClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedClass[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    arrived: 0,
    waiting: 0,
    serving: 0,
    completed: 0,
    notArrived: 0,
  });

  // Modal selector for supervised classes
  const [showClassModal, setShowClassModal] = useState(false);
  const [tempSelectedClassIds, setTempSelectedClassIds] = useState<string[]>([]);
  const [savingClasses, setSavingClasses] = useState(false);

  // Audio system state
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [activeAlarmNotification, setActiveAlarmNotification] = useState<{
    studentName: string;
    className: string;
    timeSlot: string;
    slotId: string;
  } | null>(null);

  // Live Clock
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  // 1. Initial check auth
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const json = await res.json();
        if (!json.success || !json.user) {
          router.push('/pengawas');
          return;
        }
        setCurrentUser(json.user);
        loadSupervisionConfig();
      } catch (e) {
        router.push('/pengawas');
      }
    };
    checkAuth();
  }, [router]);

  // 2. Real-time Clock (updates every second)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      setCurrentTimeStr(`${h}:${m}:${s}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 3. Load Supervision configuration (which classes this supervisor monitors)
  const loadSupervisionConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pengawas/classes');
      const json = await res.json();
      if (json.success) {
        setActiveEvent(json.activeEvent);
        setAllClasses(json.classes || []);
        const chosen = json.selectedClassIds || [];
        setSelectedClassIds(chosen);
        setTempSelectedClassIds(chosen);
        if (chosen.length > 0) {
          fetchMonitorData(chosen);
        } else {
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('Error loading supervisor config', e);
      setLoading(false);
    }
  };

  // 4. Fetch live schedule data for chosen classes
  const fetchMonitorData = async (classIds: string[]) => {
    if (!classIds || classIds.length === 0) {
      setGroupedData([]);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/pengawas/monitor?classIds=${classIds.join(',')}`);
      const json = await res.json();
      if (json.success && json.data) {
        setActiveEvent(json.data.activeEvent);
        setGroupedData(json.data.classes || []);
        if (json.data.stats) setStats(json.data.stats);
      }
    } catch (err) {
      console.error('Error fetching monitor data', err);
    } finally {
      setLoading(false);
    }
  };

  // 5. Polling interval (every 4 seconds) to update live bookings & status
  useEffect(() => {
    if (selectedClassIds.length === 0) return;
    const interval = setInterval(() => {
      fetchMonitorData(selectedClassIds);
    }, 4000);
    return () => clearInterval(interval);
  }, [selectedClassIds]);

  // 6. ALARM TRIGGER ENGINE (Sections 30 & 31)
  // Check conditions every second:
  // IF parentArrived == true AND currentTime >= slot.startTime AND slot has not yet triggered alarm -> RING!
  useEffect(() => {
    if (!currentTimeStr) return;
    const currentHHMM = currentTimeStr.slice(0, 5); // "HH:MM"

    for (const grp of groupedData) {
      for (const booking of grp.bookings) {
        // Aturan: Hanya bunyikan jika Orang Tua Datang SUDAH DICENTANG
        if (booking.parentArrived && booking.status !== 'SELESAI') {
          // Bandingkan jam: apakah waktu sekarang sudah masuk jam mulai slot
          // (Misal: currentHHMM >= booking.startTime && currentHHMM <= booking.endTime)
          if (currentHHMM >= booking.startTime && currentHHMM <= booking.endTime) {
            // Cek apakah sudah pernah dibunyikan
            if (!bellManager.hasSlotTriggered(booking.slotId)) {
              console.log(`[ALARM] Triggering alarm for ${booking.studentName} at ${booking.startTime}`);
              bellManager.playAlarm(booking.slotId);

              // Set active visual popup
              setActiveAlarmNotification({
                studentName: booking.studentName,
                className: booking.className,
                timeSlot: `${booking.startTime}–${booking.endTime}`,
                slotId: booking.slotId,
              });
            }
          }
        }
      }
    }
  }, [currentTimeStr, groupedData]);

  // Audio unlock handler
  const handleUnlockAudio = () => {
    const success = bellManager.unlockAudio();
    setAudioUnlocked(true);
    // Play a friendly soft test chime
    bellManager.playAlarm('test-init');
  };

  // Stop alarm handler
  const handleStopAlarm = () => {
    bellManager.stopAlarm();
    setActiveAlarmNotification(null);
  };

  // Toggle parent arrival checkbox
  const handleToggleArrival = async (booking: BookingRecord) => {
    const newArrival = !booking.parentArrived;

    // Optimistic update
    setGroupedData((prev) =>
      prev.map((grp) => ({
        ...grp,
        bookings: grp.bookings.map((b) =>
          b.id === booking.id
            ? {
                ...b,
                parentArrived: newArrival,
                status: newArrival ? 'MENUNGGU' : 'BELUM_DATANG',
              }
            : b
        ),
      }))
    );

    try {
      await fetch('/api/pengawas/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          parentArrived: newArrival,
        }),
      });
      // Refresh to ensure sync
      fetchMonitorData(selectedClassIds);
    } catch (e) {
      console.error('Error toggling arrival', e);
    }
  };

  // Update status (e.g. mark as SELESAI or SEDANG_DILAYANI)
  const handleUpdateStatus = async (bookingId: string, status: string) => {
    const nowIso = new Date().toISOString();

    // Optimistic update
    setGroupedData((prev) =>
      prev.map((grp) => ({
        ...grp,
        bookings: grp.bookings.map((b) => {
          if (b.id !== bookingId) return b;
          const updated: BookingRecord = {
            ...b,
            status: status as any,
          };
          if (status === 'SEDANG_DILAYANI') {
            updated.servedAt = nowIso;
            updated.parentArrived = true;
          } else if (status === 'SELESAI') {
            updated.completedAt = nowIso;
          } else if (status === 'MENUNGGU') {
            updated.completedAt = null;
          }
          return updated;
        }),
      }))
    );

    try {
      await fetch('/api/pengawas/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          status,
        }),
      });
      fetchMonitorData(selectedClassIds);
    } catch (e) {
      console.error('Error updating status', e);
    }
  };

  // Save selected classes to supervise
  const handleSaveClasses = async () => {
    try {
      setSavingClasses(true);
      const res = await fetch('/api/pengawas/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classIds: tempSelectedClassIds,
          eventId: activeEvent?.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setSelectedClassIds(tempSelectedClassIds);
        setShowClassModal(false);
        fetchMonitorData(tempSelectedClassIds);
      }
    } catch (e) {
      console.error('Error saving supervised classes', e);
    } finally {
      setSavingClasses(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/pengawas');
  };

  // Helper to determine if slot is currently active/ongoing
  const isOngoing = (startTime: string, endTime: string) => {
    if (!currentTimeStr) return false;
    const currentHHMM = currentTimeStr.slice(0, 5);
    return currentHHMM >= startTime && currentHHMM < endTime;
  };

  // Helper to format ISO date string to HH:MM (Asia/Jakarta timezone)
  const formatHHMM = (val: string | null | undefined): string => {
    if (!val) return '';
    if (/^\d{2}:\d{2}$/.test(val)) return val;
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return '';
      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d).replace('.', ':');
    } catch (e) {
      const d = new Date(val);
      const h = String(d.getHours()).padStart(2, '0');
      const m = String(d.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-navy-950 text-white border-b-2 border-gold-500 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & Supervisor Info */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-2.5">
              <div className="relative w-10 h-10 bg-white rounded-full p-0.5 shadow flex-shrink-0">
                <Image
                  src="/mumtaz.png"
                  alt="Logo Mumtaz"
                  width={40}
                  height={40}
                  className="w-full h-full object-contain rounded-full"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white tracking-tight">
                    Dashboard Pengawas
                  </h1>
                  <span className="text-xs bg-gold-500 text-navy-950 font-black px-2 py-0.5 rounded-full">
                    {currentUser?.name || 'Pengawas'}
                  </span>
                </div>
                <p className="text-[11px] text-gold-300">
                  {activeEvent ? activeEvent.name : 'Event Pengambilan Rapor'}
                </p>
              </div>
            </div>

            {/* Live Clock on Mobile */}
            <div className="md:hidden text-right font-mono text-xs font-bold text-gold-400 bg-navy-900 px-2.5 py-1 rounded border border-gold-500/30">
              {currentTimeStr} WIB
            </div>
          </div>

          {/* Action Controls: Live Clock, Audio Unlocked, Pilih Kelas, Logout */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
            {/* Live Clock on Desktop */}
            <div className="hidden md:flex items-center gap-1.5 font-mono text-xs font-bold text-gold-300 bg-navy-900/90 px-3 py-1.5 rounded-lg border border-gold-500/30">
              <Clock className="w-3.5 h-3.5 text-gold-400" />
              <span>{currentTimeStr || '08:00:00'} WIB</span>
            </div>

            {/* Audio Unlock Button */}
            {!audioUnlocked ? (
              <button
                type="button"
                onClick={handleUnlockAudio}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-navy-950 shadow flex items-center gap-1.5 animate-pulse-subtle transition"
                title="Klik untuk mengaktifkan alarm suara di browser ini"
              >
                <Volume2 className="w-4 h-4" />
                <span>AKTIFKAN SUARA</span>
              </button>
            ) : (
              <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-500/50 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Suara Aktif</span>
              </span>
            )}

            {/* Manage Supervised Classes */}
            <button
              type="button"
              onClick={() => {
                setTempSelectedClassIds(selectedClassIds);
                setShowClassModal(true);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-navy-800 hover:bg-navy-700 text-gold-400 border border-gold-500/40 shadow transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Pilih Kelas ({selectedClassIds.length})</span>
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-semibold bg-rose-900/80 hover:bg-rose-800 text-rose-200 transition flex items-center gap-1"
              title="Keluar"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Floating Active Alarm Banner (Section 30 & 31) */}
      {activeAlarmNotification && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white p-4 shadow-xl border-y-2 border-gold-400 sticky top-14 z-50 animate-bounce">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 bg-white text-rose-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <BellRing className="w-7 h-7 animate-spin" />
              </div>
              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-gold-200">
                  🔔 WAKTU PENGAMBILAN RAPOR TIBA
                </span>
                <h3 className="text-lg sm:text-xl font-black">
                  {activeAlarmNotification.studentName} – Kelas {activeAlarmNotification.className}
                </h3>
                <p className="text-xs text-amber-100">
                  Jadwal: {activeAlarmNotification.timeSlot} WIB • Orang tua sudah menunggu di lokasi
                </p>
              </div>
            </div>

            <button
              onClick={handleStopAlarm}
              className="px-5 py-2.5 bg-white text-navy-950 hover:bg-gold-300 font-black text-xs rounded-xl shadow-lg border-2 border-navy-950 uppercase tracking-wider flex items-center gap-2 transition"
            >
              <BellOff className="w-4 h-4 text-rose-600" />
              <span>HENTIKAN ALARM</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Statistics Bar (Section 35) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Jadwal</p>
              <p className="text-xl font-black text-navy-950 mt-0.5">{stats.total}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-navy-100 text-navy-900 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Orang Tua Datang</p>
              <p className="text-xl font-black text-amber-600 mt-0.5">{stats.arrived}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Menunggu</p>
              <p className="text-xl font-black text-blue-600 mt-0.5">{stats.waiting}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-medium">Sedang Dilayani</p>
              <p className="text-xl font-black text-purple-600 mt-0.5">{stats.serving}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between col-span-2 sm:col-span-1">
            <div>
              <p className="text-xs text-slate-500 font-medium">Selesai</p>
              <p className="text-xl font-black text-emerald-600 mt-0.5">{stats.completed}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Notice if no class is selected */}
        {selectedClassIds.length === 0 && (
          <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-slate-300 space-y-4">
            <div className="w-16 h-16 bg-navy-100 text-navy-900 rounded-full flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-lg font-bold text-navy-950">Belum Ada Kelas yang Dipilih</h3>
              <p className="text-xs text-slate-500">
                Silakan pilih satu atau beberapa kelas yang menjadi tanggung jawab pengawasan Anda hari ini.
              </p>
            </div>
            <button
              onClick={() => {
                setTempSelectedClassIds(selectedClassIds);
                setShowClassModal(true);
              }}
              className="px-5 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-950 text-gold-400 font-bold text-xs shadow-md transition"
            >
              PILIH KELAS PENGAWASAN
            </button>
          </div>
        )}

        {/* Supervised Classes Schedule List (Section 28, 29, 35) */}
        {groupedData.map((cls) => (
          <section
            key={cls.classId}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-3"
          >
            {/* Header Kelas */}
            <div className="bg-navy-900 text-white px-6 py-3.5 flex items-center justify-between border-b border-gold-500/40">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-gold-400"></span>
                <h2 className="text-base font-extrabold tracking-tight text-white">
                  Kelas {cls.className}
                </h2>
                <span className="text-xs text-gold-300/80 font-medium">
                  ({cls.bookings.length} Siswa Terdaftar)
                </span>
              </div>
              <span className="text-xs text-slate-300 font-medium hidden sm:inline">
                Terurut dari jam paling pagi ke paling siang
              </span>
            </div>

            {/* Tabel Jadwal Pengawasan */}
            <div className="overflow-x-auto p-4 pt-1">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3 w-24">Kelas</th>
                    <th className="py-2.5 px-3 w-32">Jam Pengambilan</th>
                    <th className="py-2.5 px-3 w-40 text-center">Orang Tua Datang</th>
                    <th className="py-2.5 px-3 w-32 text-center">Status</th>
                    <th className="py-2.5 px-3 w-40 text-center">Aksi Pengawas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cls.bookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                        Belum ada siswa di kelas {cls.className} yang mengambil jadwal pengambilan rapor.
                      </td>
                    </tr>
                  ) : (
                    cls.bookings.map((b) => {
                      const ongoing = isOngoing(b.startTime, b.endTime);

                      return (
                        <tr
                          key={b.id}
                          className={`transition-colors ${
                            ongoing
                              ? 'bg-amber-50/70 border-l-4 border-amber-500 font-semibold'
                              : b.status === 'SELESAI'
                              ? 'bg-slate-50/60 opacity-75'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          {/* Nama Siswa */}
                          <td className="py-3 px-3 font-bold text-navy-950">
                            <div className="flex items-center gap-2">
                              <span>{b.studentName}</span>
                              {ongoing && (
                                <span className="text-[10px] bg-amber-500 text-navy-950 font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse-subtle">
                                  SEDANG BERLANGSUNG
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Kelas */}
                          <td className="py-3 px-3 text-slate-600 font-medium">{b.className}</td>

                          {/* Jam Pengambilan */}
                          <td className="py-3 px-3">
                            <span className="font-extrabold text-navy-900 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                              {b.timeSlot}
                            </span>
                          </td>

                          {/* Checkbox Kedatangan Orang Tua (Section 29) */}
                          <td className="py-3 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleArrival(b)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${
                                b.parentArrived
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              {b.parentArrived ? (
                                <CheckSquare className="w-4 h-4 text-amber-700" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-400" />
                              )}
                              <span>{b.parentArrived ? 'Sudah Datang' : 'Belum Datang'}</span>
                            </button>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-3 text-center">
                            {b.status === 'BELUM_DATANG' && (
                              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                                Belum Datang
                              </span>
                            )}
                            {b.status === 'MENUNGGU' && (
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 animate-pulse-subtle">
                                Menunggu
                              </span>
                            )}
                            {b.status === 'SEDANG_DILAYANI' && (
                              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-200">
                                Sedang Dilayani
                              </span>
                            )}
                            {b.status === 'SELESAI' && (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
                                ✓ Selesai
                              </span>
                            )}
                          </td>

                          {/* Aksi Pengawas */}
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-start justify-center gap-2">
                              {b.status !== 'SELESAI' ? (
                                <>
                                  <div className="flex flex-col items-center">
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateStatus(b.id, 'SEDANG_DILAYANI')}
                                      className={`px-2.5 py-1 rounded text-[11px] font-bold transition shadow-sm ${
                                        b.status === 'SEDANG_DILAYANI'
                                          ? 'bg-purple-700 text-white ring-2 ring-purple-300'
                                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                                      }`}
                                      title={
                                        b.status === 'SEDANG_DILAYANI'
                                          ? 'Sedang dilayani (klik untuk perbarui jam masuk)'
                                          : 'Mulai layani'
                                      }
                                    >
                                      Layani
                                    </button>
                                    {b.servedAt && (
                                      <span
                                        className="text-[11px] font-bold text-purple-800 mt-1 flex items-center gap-0.5 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200"
                                        title="Waktu orang tua masuk dilayani"
                                      >
                                        <Clock className="w-2.5 h-2.5 text-purple-600" />
                                        <span>{formatHHMM(b.servedAt)}</span>
                                      </span>
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(b.id, 'SELESAI')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-sm transition"
                                    title="Selesai pengambilan rapor"
                                  >
                                    Selesai
                                  </button>
                                </>
                              ) : (
                                <div className="flex flex-col items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(b.id, 'MENUNGGU')}
                                    className="text-[10px] text-slate-400 hover:text-slate-600 underline"
                                  >
                                    Batalkan Selesai
                                  </button>
                                  {b.servedAt && (
                                    <span
                                      className="text-[10px] text-slate-500 font-medium flex items-center gap-0.5"
                                      title="Waktu orang tua masuk dilayani"
                                    >
                                      <Clock className="w-2.5 h-2.5 text-slate-400" />
                                      <span>Masuk: {formatHHMM(b.servedAt)}</span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </main>

      {/* Modal: Pilih Kelas yang Diawasi (Section 28 & 34) */}
      {showClassModal && (
        <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-navy-950 text-white p-5 border-b-2 border-gold-500">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Layers className="w-5 h-5 text-gold-400" />
                <span>Pilih Kelas yang Diawasi</span>
              </h3>
              <p className="text-xs text-gold-300/80 mt-0.5">
                Centang satu atau beberapa kelas yang menjadi tanggung jawab Anda
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {allClasses.map((cls) => {
                  const isChecked = tempSelectedClassIds.includes(cls.id);
                  return (
                    <button
                      key={cls.id}
                      type="button"
                      onClick={() => {
                        if (isChecked) {
                          setTempSelectedClassIds(tempSelectedClassIds.filter((id) => id !== cls.id));
                        } else {
                          setTempSelectedClassIds([...tempSelectedClassIds, cls.id]);
                        }
                      }}
                      className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                        isChecked
                          ? 'border-navy-900 bg-navy-900 text-gold-400 shadow-sm'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>Kelas {cls.name}</span>
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-gold-400" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={savingClasses}
                  onClick={handleSaveClasses}
                  className="px-5 py-2 text-xs font-bold bg-navy-900 hover:bg-navy-950 text-gold-400 rounded-lg shadow transition flex items-center gap-1.5"
                >
                  {savingClasses ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>SIMPAN PENGAWASAN</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
