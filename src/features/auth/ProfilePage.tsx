import { useProfile } from '@/modules/auth/hooks/useAuth';
import { formatDate } from '@/shared/lib/formatter';
import {
  User,
  Mail,
  IdCard,
  Calendar,
  ShieldCheck,
  Building2,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
  const navigate = useNavigate();
  const { data: profileRes, isLoading, error } = useProfile();
  const profile = profileRes?.data;

  const handleBack = () => {
    navigate(-1);
  };

  // Get user initials for avatar fallback
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-secondary text-sm font-medium">Memuat profil pengguna...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 bg-error-container text-error rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-on-background">Gagal Memuat Profil</h3>
          <p className="text-secondary text-sm mt-1">{error?.message || 'Terjadi kesalahan saat mengambil data profil.'}</p>
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl font-semibold hover:bg-primary-container transition-colors shadow-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Header Navigation */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleBack}
          className="p-2 border border-outline-variant rounded-xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors text-on-surface-variant cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-on-background">Profil Saya</h1>
          <p className="text-secondary text-xs md:text-sm">Kelola informasi akun Anda dan pengaturan keamanan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card Summary */}
        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
            
            {/* Avatar */}
            <div className="mt-4 mb-4 relative">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.fullName}
                  className="w-24 h-24 rounded-full object-cover border-2 border-outline-variant shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary-container to-tertiary-container flex items-center justify-center border-2 border-outline-variant shadow-md">
                  <span className="text-white text-3xl font-extrabold tracking-wider">
                    {getInitials(profile.fullName)}
                  </span>
                </div>
              )}
              {profile.isActive && (
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white flex items-center justify-center" title="Aktif"></span>
              )}
            </div>

            <h2 className="text-xl font-bold text-on-background line-clamp-1">{profile.fullName}</h2>
            <p className="text-secondary text-sm mt-0.5 break-all">{profile.email}</p>
            
            <div className="mt-4 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 rounded-full text-xs font-semibold border border-emerald-200/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Status: {profile.isActive ? 'Aktif' : 'Nonaktif'}</span>
            </div>

            {profile.employeeId && (
              <div className="mt-5 pt-5 border-t border-outline-variant/50 w-full flex flex-col gap-1.5">
                <span className="text-secondary text-xs uppercase tracking-wider font-semibold">ID Karyawan</span>
                <span className="text-on-background font-mono font-bold text-sm bg-surface-container py-1.5 px-3 rounded-lg border border-outline-variant/30">
                  {profile.employeeId}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Information */}
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <h3 className="text-lg font-bold text-on-background pb-3 border-b border-outline-variant/50 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span>Informasi Detail Akun</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-secondary text-xs font-semibold uppercase tracking-wider">Nama Lengkap</h4>
                  <p className="text-on-background text-base font-bold mt-0.5">{profile.fullName}</p>
                </div>
              </div>

              {/* Email Address */}
              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-secondary text-xs font-semibold uppercase tracking-wider">Alamat Email</h4>
                  <p className="text-on-background text-base font-bold mt-0.5 break-all">{profile.email}</p>
                </div>
              </div>

              {/* Employee ID */}
              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5 shrink-0">
                  <IdCard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-secondary text-xs font-semibold uppercase tracking-wider">ID Karyawan</h4>
                  <p className="text-on-background text-base font-bold mt-0.5">{profile.employeeId || '-'}</p>
                </div>
              </div>

              {/* Created At */}
              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5 shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-secondary text-xs font-semibold uppercase tracking-wider">Tanggal Terdaftar</h4>
                  <p className="text-on-background text-base font-bold mt-0.5">
                    {formatDate(profile.createdAt, 'datetime')}
                  </p>
                </div>
              </div>

              {/* Updated At */}
              <div className="flex gap-3.5 items-start">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-secondary text-xs font-semibold uppercase tracking-wider">Terakhir Diperbarui</h4>
                  <p className="text-on-background text-base font-bold mt-0.5">
                    {formatDate(profile.updatedAt, 'datetime')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
