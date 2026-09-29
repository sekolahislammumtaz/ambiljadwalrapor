'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  User,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronRight,
  ShieldAlert,
  ArrowRight,
  Lock,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
}

interface StudentItem {
  id: string;
  name: string;
}

interface SlotItem {
  id: string;
  startTime: string;
  endTime: string;
  status: 'AVAILABLE' | 'BOOKED';
}

interface RecapItem {
  no: number;
  id: string;
  studentName: string;
  className: string;
  timeSlot: string;
  startTime: string;
  endTime: string;
}

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [setting, setSetting] = useState<{ title: string; subtitle: string; logo: string }>({
    title: 'Jadwal Pengambilan Rapor',
    subtitle: 'Silakan pilih jadwal pengambilan rapor Ananda',
    logo: '/mumtaz.png',
  });

  // Wizard state
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [studentSearch, setStudentSearch] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('');

  // Recap state
  const [recapList, setRecapList] = useState<RecapItem[]>([]);
  const [loadingRecap, setLoadingRecap] = useState(false);

  // Booking result
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Current Step (1: Kelas, 2: Siswa, 3: Jadwal, 4: Konfirmasi)
  const currentStep = useMemo(() => {
    if (bookingSuccess) return 5;
    if (selectedSlotId) return 4;
    if (selectedStudentId) return 3;
    if (selectedClassId) return 2;
    return 1;
  }, [selectedClassId, selectedStudentId, selectedSlotId, bookingSuccess]);

  // Initial load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/public/data');
      const json = await res.json();
      if (json.success) {
        if (json.data.setting) setSetting(json.data.setting);
        setActiveEvent(json.data.event);
        setClasses(json.data.classes || []);
      }
    } catch (err) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // When class changes, fetch students, slots, and recap for this class
  const loadClassData = async (classId: string) => {
    if (!classId) {
      setStudents([]);
      setSlots([]);
      setRecapList([]);
      return;
    }

    try {
      setLoadingRecap(true);
      const res = await fetch(`/api/public/data?classId=${classId}`);
      const json = await res.json();
      if (json.success) {
        setStudents(json.data.students || []);
        setSlots(json.data.slots || []);
        setRecapList(json.data.bookedRecap || []);
      }
    } catch (err) {
      console.error('Failed to load class data', err);
    } finally {
      setLoadingRecap(false);
    }
  };

  const handleSelectClass = (cId: string) => {
    setSelectedClassId(cId);
    setSelectedStudentId('');
    setSelectedSlotId('');
    setStudentSearch('');
    setErrorMessage(null);
    setBookingSuccess(null);
    loadClassData(cId);
  };

  const handleSelectStudent = (sId: string) => {
    setSelectedStudentId(sId);
    setSelectedSlotId('');
    setErrorMessage(null);
  };

  const handleSelectSlot = (slotId: string) => {
    setSelectedSlotId(slotId);
    setErrorMessage(null);
  };

  const handleConfirmBooking = async () => {
    if (!activeEvent || !selectedClassId || !selectedStudentId || !selectedSlotId) {
      setErrorMessage('Mohon lengkapi semua pilihan sebelum melakukan konfirmasi.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const res = await fetch('/api/public/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeEvent.id,
          classId: selectedClassId,
          studentId: selectedStudentId,
          slotId: selectedSlotId,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setErrorMessage(json.message || 'Gagal menyimpan booking. Silakan coba lagi.');
        // Refresh slot data in case slot was taken
        loadClassData(selectedClassId);
        return;
      }

      setBookingSuccess(json.booking);
      // Refresh class data to update recap and available slots immediately
      loadClassData(selectedClassId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetBooking = () => {
    setBookingSuccess(null);
    setSelectedStudentId('');
    setSelectedSlotId('');
    setErrorMessage(null);
    if (selectedClassId) {
      loadClassData(selectedClassId);
    }
  };

  // Filter students based on search
  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return students;
    return students.filter((s) => s.name.toLowerCase().includes(studentSearch.toLowerCase()));
  }, [students, studentSearch]);

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const selectedSlot = slots.find((s) => s.id === selectedSlotId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="bg-navy-950 text-white border-b-2 border-gold-500 shadow-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo & School Name */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <div className="relative w-12 h-12 flex-shrink-0 bg-white rounded-full p-0.5 shadow-md">
              <Image
                src={setting.logo || '/mumtaz.png'}
                alt="Logo Mumtaz"
                width={48}
                height={48}
                className="w-full h-full object-contain rounded-full"
                priority
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Sekolah Islam Mumtaz</span>
              </h1>
              <p className="text-xs text-gold-300 font-medium tracking-wide">
                Bandar Lampung • Muslim Kaffah School
              </p>
            </div>
          </div>

          {/* Login Buttons: LOGIN ADMIN & LOGIN PENGAWAS */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <Link
              href="/admin"
              className="flex-1 sm:flex-initial text-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-navy-800 hover:bg-navy-700 text-gold-400 border border-gold-500/40 shadow-sm transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-gold-400" />
              <span>LOGIN ADMIN</span>
            </Link>
            <Link
              href="/pengawas"
              className="flex-1 sm:flex-initial text-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gold-500 hover:bg-gold-400 text-navy-950 font-bold shadow-sm transition-all duration-150 flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-navy-950" />
              <span>LOGIN PENGAWAS</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Banner with Title and Subtitle */}
      <div className="bg-gradient-to-b from-navy-900 to-navy-800 text-white py-8 px-4 sm:px-6 shadow-inner">
        <div className="max-w-4xl mx-auto text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-navy-950/60 border border-gold-400/30 px-3 py-1 rounded-full text-gold-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>{activeEvent ? activeEvent.name : 'Periode Pengambilan Rapor'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
            {setting.title}
          </h2>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal">
            {setting.subtitle}
          </p>
          {activeEvent && (
            <p className="text-xs text-gold-300/90 font-medium">
              Tanggal Pelaksanaan: <span className="font-bold underline">{activeEvent.date}</span> (Mulai Pukul {activeEvent.startTime || '08:00'} WIB)
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Step Progress Indicator */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-4 gap-2">
            {[
              { num: 1, label: '1. Pilih Kelas' },
              { num: 2, label: '2. Pilih Siswa' },
              { num: 3, label: '3. Pilih Jadwal' },
              { num: 4, label: '4. Konfirmasi' },
            ].map((step) => {
              const isActive = currentStep === step.num;
              const isPassed = currentStep > step.num;
              return (
                <div
                  key={step.num}
                  className={`flex flex-col sm:flex-row items-center gap-1.5 p-2 rounded-lg text-center sm:text-left transition-all ${
                    isActive
                      ? 'bg-navy-900 text-gold-400 font-semibold shadow'
                      : isPassed
                      ? 'bg-emerald-50 text-emerald-700 font-medium'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-bold ${
                      isActive
                        ? 'bg-gold-500 text-navy-950'
                        : isPassed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isPassed ? '✓' : step.num}
                  </span>
                  <span className="text-xs tracking-tight hidden sm:inline">{step.label}</span>
                  <span className="text-[11px] sm:hidden font-medium">Langkah {step.num}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-lg shadow-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-rose-800">Perhatian</h4>
              <p className="text-xs text-rose-700 mt-0.5">{errorMessage}</p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-400 hover:text-rose-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Step 5: SUCCESS STATE */}
        {bookingSuccess && (
          <div className="bg-white rounded-2xl shadow-lg border-2 border-emerald-500 overflow-hidden text-center p-8 space-y-6">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Berhasil Dikonfirmasi
              </span>
              <h3 className="text-2xl sm:text-3xl font-black text-navy-950">
                Jadwal Berhasil Disimpan!
              </h3>
              <p className="text-slate-600 text-sm max-w-md mx-auto">
                Terima kasih Ayah/Bunda. Jadwal pengambilan rapor untuk Ananda telah resmi terdaftar dalam sistem.
              </p>
            </div>

            {/* Ticket Card */}
            <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 text-left">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500">Nama Siswa:</span>
                <span className="text-sm font-bold text-navy-950">{bookingSuccess.studentName}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500">Kelas:</span>
                <span className="text-sm font-bold text-navy-900">{bookingSuccess.className}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs text-slate-500">Tanggal:</span>
                <span className="text-sm font-bold text-navy-900">{bookingSuccess.date}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-slate-500 font-semibold">Jam Pengambilan:</span>
                <span className="text-base font-black text-navy-950 bg-gold-200/80 px-2 py-0.5 rounded text-gold-900">
                  {bookingSuccess.timeSlot}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleResetBooking}
                className="px-6 py-2.5 rounded-lg bg-navy-900 hover:bg-navy-800 text-gold-400 font-semibold text-sm shadow transition"
              >
                Pilih Jadwal untuk Siswa Lain
              </button>
            </div>
          </div>
        )}

        {/* BOOKING FORM (Steps 1 to 4) */}
        {!bookingSuccess && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 divide-y divide-slate-100">
            {/* TAHAP 1: PILIH KELAS */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-900 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-950">Pilih Kelas Ananda</h3>
                    <p className="text-xs text-slate-500">Pilih kelas tempat Ananda menempuh pendidikan</p>
                  </div>
                </div>
                {selectedClass && (
                  <span className="text-xs font-bold bg-navy-900 text-gold-400 px-3 py-1 rounded-full">
                    Terpilih: {selectedClass.name}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 pt-2">
                {classes.map((c) => {
                  const isSelected = selectedClassId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectClass(c.id)}
                      className={`p-3 rounded-xl border text-center font-bold text-sm transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'border-navy-900 bg-navy-900 text-gold-400 shadow-md ring-2 ring-gold-400'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <GraduationCap className={`w-5 h-5 ${isSelected ? 'text-gold-400' : 'text-slate-400'}`} />
                      <span>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TAHAP 2: PILIH NAMA SISWA */}
            {selectedClassId && (
              <div className="p-6 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-900 flex items-center justify-center font-bold text-sm">
                      2
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-navy-950">Pilih Nama Siswa ({selectedClass?.name})</h3>
                      <p className="text-xs text-slate-500">
                        {students.length > 0
                          ? `Tersedia ${students.length} siswa yang belum mengambil jadwal`
                          : 'Semua siswa di kelas ini sudah memiliki jadwal'}
                      </p>
                    </div>
                  </div>
                  {selectedStudent && (
                    <span className="text-xs font-bold bg-navy-900 text-gold-400 px-3 py-1 rounded-full">
                      Terpilih: {selectedStudent.name}
                    </span>
                  )}
                </div>

                {/* Search input */}
                <div className="relative max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Ketik nama Ananda untuk mencari..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-800 focus:outline-none bg-slate-50"
                  />
                </div>

                {/* Student options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {filteredStudents.length === 0 ? (
                    <div className="col-span-full py-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                      Tidak ada nama siswa yang cocok
                    </div>
                  ) : (
                    filteredStudents.map((s) => {
                      const isSelected = selectedStudentId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectStudent(s.id)}
                          className={`p-3 rounded-lg border text-left text-xs font-semibold transition flex items-center justify-between ${
                            isSelected
                              ? 'border-navy-900 bg-navy-900 text-gold-400 shadow ring-1 ring-gold-400'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <User className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-gold-400' : 'text-slate-400'}`} />
                            <span className="truncate">{s.name}</span>
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-gold-400 flex-shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAHAP 3: PILIH JADWAL */}
            {selectedStudentId && (
              <div className="p-6 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-900 flex items-center justify-center font-bold text-sm">
                      3
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-navy-950">Pilih Slot Waktu Pengambilan Rapor</h3>
                      <p className="text-xs text-slate-500">
                        Waktu istirahat (11.45–13.00 WIB) tidak tersedia untuk pemilihan slot
                      </p>
                    </div>
                  </div>
                  {selectedSlot && (
                    <span className="text-xs font-bold bg-navy-900 text-gold-400 px-3 py-1 rounded-full">
                      Jam: {selectedSlot.startTime}–{selectedSlot.endTime} WIB
                    </span>
                  )}
                </div>

                {/* Slot Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {slots.length === 0 ? (
                    <div className="col-span-full py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                      Belum ada slot jadwal yang digenerate untuk kelas ini. Harap hubungi Admin.
                    </div>
                  ) : (
                    slots.map((slot) => {
                      const isBooked = slot.status === 'BOOKED';
                      const isSelected = selectedSlotId === slot.id;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => handleSelectSlot(slot.id)}
                          className={`p-3 rounded-xl border text-center transition-all duration-150 flex flex-col items-center justify-center gap-1 ${
                            isBooked
                              ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              : isSelected
                              ? 'border-navy-900 bg-navy-900 text-gold-400 shadow-md ring-2 ring-gold-400'
                              : 'border-slate-200 bg-white hover:border-gold-500 hover:bg-gold-50/30 text-navy-950'
                          }`}
                        >
                          <Clock className={`w-4 h-4 ${isSelected ? 'text-gold-400' : isBooked ? 'text-slate-300' : 'text-gold-600'}`} />
                          <span className="font-extrabold text-xs">
                            {slot.startTime}–{slot.endTime}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            isBooked ? 'text-rose-500' : isSelected ? 'text-gold-300' : 'text-emerald-600'
                          }`}>
                            {isBooked ? 'Sudah Dipilih' : isSelected ? 'Pilihan Anda' : 'Tersedia'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAHAP 4: KONFIRMASI */}
            {selectedSlotId && (
              <div className="p-6 bg-slate-50/70 space-y-4 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-navy-100 text-navy-900 flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy-950">Konfirmasi Jadwal Pengambilan Rapor</h3>
                    <p className="text-xs text-slate-500">Pastikan data berikut sudah sesuai sebelum menekan konfirmasi</p>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm max-w-lg mx-auto space-y-3">
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Kelas:</span>
                    <span className="font-bold text-navy-900">{selectedClass?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Nama Siswa:</span>
                    <span className="font-bold text-navy-950 text-sm">{selectedStudent?.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-500">Tanggal:</span>
                    <span className="font-semibold text-navy-900">{activeEvent?.date || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="text-slate-500 font-semibold">Jam Pengambilan:</span>
                    <span className="font-black text-sm bg-navy-900 text-gold-400 px-2.5 py-1 rounded shadow-sm">
                      {selectedSlot?.startTime}–{selectedSlot?.endTime} WIB
                    </span>
                  </div>

                  <div className="pt-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleConfirmBooking}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-navy-900 to-navy-800 hover:from-navy-950 hover:to-navy-900 text-gold-400 font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 border border-gold-500/50"
                    >
                      {submitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-gold-400" />
                          <span>Menyimpan Jadwal...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-gold-400" />
                          <span>KONFIRMASI JADWAL</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* BAGIAN PENTING: REKAPAN JADWAL SAAT KELAS DIPILIH (Sections 8, 45) */}
        {selectedClassId && (
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-navy-950 flex items-center gap-2">
                  <span>Jadwal Pengambilan Rapor – {selectedClass?.name}</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar siswa yang sudah memilih jadwal. Diurutkan otomatis berdasarkan jam pengambilan dari paling pagi ke paling siang.
                </p>
              </div>
              <button
                onClick={() => loadClassData(selectedClassId)}
                className="text-xs flex items-center gap-1.5 text-navy-700 hover:text-navy-950 font-medium px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingRecap ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            {/* Tabel Rekapan yang Responsif */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-navy-900 text-gold-400 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4 w-12 text-center rounded-l-lg">No</th>
                    <th className="py-3 px-4">Nama Siswa</th>
                    <th className="py-3 px-4 w-28">Kelas</th>
                    <th className="py-3 px-4 w-40 text-center rounded-r-lg">Jam Pengambilan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recapList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                        Belum ada siswa di kelas {selectedClass?.name} yang mengambil jadwal rapor.
                      </td>
                    </tr>
                  ) : (
                    recapList.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-center font-bold text-slate-500">{item.no}</td>
                        <td className="py-3 px-4 font-bold text-navy-950">{item.studentName}</td>
                        <td className="py-3 px-4 text-slate-600 font-medium">{item.className}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block bg-navy-50 text-navy-900 font-extrabold px-3 py-1 rounded-md border border-navy-200">
                            {item.timeSlot} WIB
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-navy-950 text-slate-400 text-xs py-6 border-t border-slate-800 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-1">
          <p className="font-semibold text-slate-300">
            Sekolah Islam Mumtaz Bandar Lampung
          </p>
          <p className="text-[11px] text-slate-500">
            Sistem Informasi Jadwal Pengambilan Rapor Siswa
          </p>
        </div>
      </footer>
    </div>
  );
}
