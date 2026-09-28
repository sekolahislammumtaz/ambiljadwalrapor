'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, User, ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Username dan password wajib diisi.');
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
        setError(json.message || 'Login gagal. Periksa kembali username dan password Anda.');
        return;
      }

      if (json.user.role !== 'ADMIN') {
        setError('Hanya akun Administrator yang dapat mengakses halaman ini.');
        return;
      }

      router.push('/admin');
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
        <span className="text-xs text-slate-500 font-medium">Panel Administrator</span>
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
            <ShieldAlert className="w-5 h-5 text-gold-400" />
            <span>Login Administrator</span>
          </h2>
          <p className="text-xs text-gold-300 mt-1">
            Sekolah Islam Mumtaz • Sistem Pengambilan Rapor
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
              Username Admin
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-800 focus:outline-none"
                required
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-navy-950">
              Password Admin
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="Masukkan password admin"
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
                <Lock className="w-4 h-4 text-gold-400" />
                <span>MASUK KE DASHBOARD</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
