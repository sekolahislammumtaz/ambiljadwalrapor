'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, UserCheck, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export default function PengawasLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('pengawas1');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Pilih nama pengawas dan masukkan password.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.message || 'Login gagal. Periksa kembali password Anda.');
        return;
      }

      if (json.user.role !== 'SUPERVISOR' && json.user.role !== 'ADMIN') {
        setError('Akun ini tidak memiliki hak akses Pengawas.');
        return;
      }

      router.push('/pengawas/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      {/* Back button */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-800 hover:text-navy-950 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Halaman Utama</span>
        </Link>
        <span className="text-xs text-slate-500 font-medium">Portal Pengawas</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-navy-950 text-white p-6 text-center border-b-2 border-gold-500 relative">
          <div className="w-16 h-16 bg-white rounded-full p-1 mx-auto shadow-md mb-3 flex items-center justify-center">
            <Image
              src="/mumtaz.png"
              alt="Logo Mumtaz"
              width={56}
              height={56}
              className="w-full h-full object-contain rounded-full"
              priority
            />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold-400" />
            <span>Login Pengawas</span>
          </h2>
          <p className="text-xs text-gold-300 mt-1">
            Pengawasan & Monitoring Pengambilan Rapor Santri
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy-950">
              Pilih Akun Pengawas
            </label>
            <div className="relative">
              <select
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-navy-800 focus:outline-none appearance-none"
              >
                <option value="pengawas1">Pengawas 1</option>
                <option value="pengawas2">Pengawas 2</option>
                <option value="pengawas3">Pengawas 3</option>
                <option value="pengawas4">Pengawas 4</option>
                <option value="pengawas5">Pengawas 5</option>
                <option value="pengawas6">Pengawas 6</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                ▼
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy-950">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Masukkan password pengawas"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-800 focus:outline-none"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-navy-900 hover:bg-navy-950 text-gold-400 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 border border-gold-500/50 mt-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-gold-400" />
                <span>Memproses Login...</span>
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-gold-400" />
                <span>LOGIN</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
